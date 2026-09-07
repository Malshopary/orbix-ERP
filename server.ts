import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { testDbConnection, getSyncPayload, setSyncPayload, getDbCustomers, upsertDbCustomer } from './src/db/erp.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  testCustomConnection,
  initCustomTenantDatabase,
  syncTenantData,
  loadTenantData,
  TenantConnectionConfig,
} from './src/db/tenant.ts';

dotenv.config();

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Immediate health check endpoint for Cloud Run and container probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Deep database health check endpoint
app.get('/api/health/db', async (_req, res) => {
  const dbHealth = await testDbConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealth.ok ? 'connected' : 'error',
    details: dbHealth,
  });
});

// Database status & info
app.get('/api/database/status', async (_req, res) => {
  try {
    const health = await testDbConnection();
    res.json({
      engine: 'PostgreSQL (Google Cloud SQL)',
      status: health.ok ? 'online' : 'unreachable',
      host: process.env.SQL_HOST ? 'Configured (Unix Socket Proxy)' : 'Missing',
      database: process.env.SQL_DB_NAME || 'Default',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Database error' });
  }
});

// Auth sync endpoint for users
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }
    const user = await getOrCreateUser(uid, email, name);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error syncing auth user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Full state Cloud SQL sync (Two-way cloud persistence for ERP)
app.get('/api/sync/state', async (_req, res) => {
  try {
    const state = await getSyncPayload('orbix_erp_cloud_snapshot');
    res.json({ success: true, state });
  } catch (error: any) {
    console.error('Error loading cloud state:', error);
    res.status(500).json({ error: 'Failed to retrieve cloud data' });
  }
});

app.post('/api/sync/state', async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State payload is required' });
    }
    await setSyncPayload('orbix_erp_cloud_snapshot', state);
    res.json({ success: true, message: 'Cloud database updated successfully' });
  } catch (error: any) {
    console.error('Error saving cloud state:', error);
    res.status(500).json({ error: 'Failed to persist state to Cloud SQL' });
  }
});

// Direct Customer API
app.get('/api/customers', async (_req, res) => {
  try {
    const data = await getDbCustomers();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await upsertDbCustomer(req.body);
    res.json({ success: true, customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MULTI-TENANT & CUSTOM CLIENT POSTGRESQL / CLOUD SQL ENDPOINTS
app.post('/api/tenant/test-connection', async (req, res) => {
  try {
    const config: TenantConnectionConfig = req.body;
    const result = await testCustomConnection(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/tenant/init-schema', async (req, res) => {
  try {
    const config: TenantConnectionConfig = req.body;
    const result = await initCustomTenantDatabase(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post('/api/tenant/sync-state', async (req, res) => {
  try {
    const { config, state } = req.body;
    if (!config || !state) {
      return res.status(400).json({ ok: false, message: 'Config and state are required' });
    }
    const result = await syncTenantData(config, state);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post('/api/tenant/load-state', async (req, res) => {
  try {
    const config: TenantConnectionConfig = req.body;
    if (!config) {
      return res.status(400).json({ ok: false, message: 'Config is required' });
    }
    const data = await loadTenantData(config);
    res.json({ ok: true, state: data });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Safe filename and directory resolution for both ESM (tsx) and CJS (dist/server.cjs)
const getModulePath = () => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return typeof __filename !== 'undefined' ? __filename : '';
  }
};

const currentFilePath = getModulePath();
const currentDirPath = currentFilePath ? path.dirname(currentFilePath) : process.cwd();

// Detect if running bundled production or development
const isBundled = currentFilePath.endsWith('.cjs') || currentFilePath.includes('dist') || typeof require !== 'undefined';
const isProduction = process.env.NODE_ENV === 'production' || isBundled;

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const candidatePaths = [
      path.join(process.cwd(), 'dist'),
      currentDirPath,
      path.join(currentDirPath, 'dist'),
      path.join(currentDirPath, '..', 'dist'),
    ];
    const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || candidatePaths[0];

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Orbix ERP: Frontend build not found.');
      }
    });
  }

  // Determine port: in dev workspace always 3000; in deployed Cloud Run use process.env.PORT (defaults to 8080 or 3000)
  const primaryPort = isProduction && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const server = app.listen(primaryPort, '0.0.0.0', () => {
    console.log(`Orbix ERP Full-Stack Server running on http://0.0.0.0:${primaryPort} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    console.error(`Server error on primary port ${primaryPort}:`, err.message);
    if (err.code === 'EADDRINUSE' && primaryPort !== 3000) {
      console.log('Falling back to listen on port 3000...');
      app.listen(3000, '0.0.0.0', () => {
        console.log('Orbix ERP Full-Stack Server running on fallback port 3000');
      });
    }
  });

  // In production, if primaryPort is not 3000, also listen on port 3000 as secondary listener
  if (isProduction && primaryPort !== 3000) {
    try {
      const secondary = app.listen(3000, '0.0.0.0', () => {
        console.log('Orbix ERP secondary listener active on http://0.0.0.0:3000');
      });
      secondary.on('error', (_err: any) => {
        // Silently ignore if port 3000 is unavailable
      });
    } catch {
      // Ignore
    }
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
