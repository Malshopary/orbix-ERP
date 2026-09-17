import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import { resetPool } from './src/db/index.ts';

const execFileAsync = promisify(execFile);
import {
  testDbConnection,
  getSyncPayload,
  setSyncPayload,
  getDbCustomers,
  upsertDbCustomer,
  getDbTasks,
  upsertDbTask,
  deleteDbTask,
  getDbChatMessages,
  insertDbChatMessage,
  ensureCoreTablesExist,
  purgeAllDbData,
  syncSnapshotToRelationalTables,
} from './src/db/erp.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  testCustomConnection,
  initCustomTenantDatabase,
  syncTenantData,
  loadTenantData,
  autoProvisionLocalTenant,
  TenantConnectionConfig,
} from './src/db/tenant.ts';

dotenv.config();

// Process Safeguards: Prevent server from exiting on unhandled client network or DB errors
process.on('uncaughtException', (err) => {
  console.error('[Orbix Server Safeguard] Uncaught Exception caught:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Orbix Server Safeguard] Unhandled Rejection caught:', (reason as any)?.message || reason);
});

const app = express();

// Disable X-Powered-By to prevent fingerprinting
app.disable('x-powered-by');

// Enterprise Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite HMR, inline assets, barcodes & dynamic scripts
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows LAN devices to load assets
  })
);

// Helper to check if origin is permitted (Localhost, Electron, or LAN private IP ranges)
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Direct requests, Electron, mobile PWA shell, curl
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // Localhost & loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') {
      return true;
    }

    // Private IPv4 ranges for local network (LAN) multi-device access
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return true;
    }

    // Local computer names (e.g. 'DESKTOP-ABC' without dots)
    if (!hostname.includes('.')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

// Hardened CORS with LAN & Localhost Support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    console.warn(`[Security Alert] Blocked untrusted cross-origin request from: ${origin}`);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Orbix-Admin-Key, X-Orbix-Client'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Multi-Tier Rate Limiting
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1200, // 1200 requests per 15 mins (ample for real-time polling & multi-device POS)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تم تجاوز معدل الطلبات المسموح به مؤقتاً، يرجى الانتظار قليلاً.' },
});
app.use('/api/', generalApiLimiter);

const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 25, // 25 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تم تجاوز الحد الأقصى لطلبات الذكاء الاصطناعي، يرجى الانتظار دقيقة واحدة.' },
});
app.use('/api/ai/', aiRateLimiter);

const backupRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تم تجاوز الحد المسموح لعمليات النسخ الاحتياطي، يرجى الانتظار.' },
});
app.use('/api/backup/', backupRateLimiter);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));


// Immediate health check endpoint for Cloud Run and container probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Network LAN discovery endpoint for local multi-device access
app.get('/api/network/info', (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const addresses: { iface: string; ip: string; url: string }[] = [];

    for (const [name, netList] of Object.entries(interfaces)) {
      if (!netList) continue;
      for (const net of netList) {
        // Only consider non-internal IPv4
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push({
            iface: name,
            ip: net.address,
            url: `http://${net.address}:${port}`,
          });
        }
      }
    }

    res.json({
      success: true,
      port,
      hostname: os.hostname(),
      hostIps: addresses,
      localUrl: `http://localhost:${port}`,
      primaryLanUrl: addresses.length > 0 ? addresses[0].url : `http://localhost:${port}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to detect network interfaces' });
  }
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
    // Simultaneously sync all records into their dedicated relational PostgreSQL tables
    syncSnapshotToRelationalTables(state).catch((e) => console.warn('Relational sync error:', e));
    res.json({ success: true, message: 'Cloud database updated successfully' });
  } catch (error: any) {
    console.error('Error saving cloud state:', error);
    res.status(500).json({ error: 'Failed to persist state to Cloud SQL' });
  }
});

// Purge cloud snapshot
app.delete('/api/sync/state', async (_req, res) => {
  try {
    await purgeAllDbData();
    res.json({ success: true, message: 'Cloud database snapshot and tables purged successfully' });
  } catch (error: any) {
    console.error('Error purging sync state:', error);
    res.status(500).json({ error: 'Failed to purge cloud data' });
  }
});

// Complete System Purge & Factory Reset API
app.post('/api/system/purge-data', async (_req, res) => {
  try {
    await purgeAllDbData();
    res.json({
      success: true,
      message: 'تم تفريغ كافة بيانات النظام السابقة وقاعدة البيانات بنجاح، والنظام الآن في حالة نظيفة 100% جاهزة لمستخدم جديد.',
    });
  } catch (error: any) {
    console.error('System purge error:', error);
    res.status(500).json({ success: false, error: error.message || 'فشل تفريغ قاعدة البيانات' });
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

// ==========================================
// EMPLOYEE TASKS & TO-DO API
// ==========================================
app.get('/api/tasks', async (_req, res) => {
  try {
    const data = await getDbTasks();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = await upsertDbTask(req.body);
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await deleteDbTask(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// TEAM CHAT MESSAGES API
// ==========================================
app.get('/api/chat/messages', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 500;
    const messages = await getDbChatMessages(limit);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/messages', async (req, res) => {
  try {
    const message = await insertDbChatMessage(req.body);
    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ULTRA-FAST LIVE SYNC FOR MULTI-DEVICE POLLING
// ==========================================
app.get('/api/sync/live', async (_req, res) => {
  try {
    const [tasks, messages] = await Promise.all([
      getDbTasks(),
      getDbChatMessages(250),
    ]);
    res.json({ success: true, tasks, messages });
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

// Helper to safely update .env file and active process.env
function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = val;
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${val}`);
    } else {
      content = content.trimEnd() + `\n${key}=${val}\n`;
    }
  }

  fs.writeFileSync(envPath, content, 'utf8');
}

// 1. Get current DB configuration for initial setup wizard
app.get('/api/setup/db-config', (_req, res) => {
  try {
    res.json({
      success: true,
      config: {
        host: process.env.SQL_HOST || 'localhost',
        port: process.env.SQL_PORT || '5432',
        database: process.env.SQL_DB_NAME || 'orbix_erp',
        user: process.env.SQL_USER || 'postgres',
        password: process.env.SQL_PASSWORD || '123',
        ssl: process.env.SQL_SSL === 'true',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Test DB connection during initial setup with strict sanitization
app.post('/api/setup/test-db', async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;

    if (!host || !database || !user) {
      return res.status(400).json({
        ok: false,
        error: 'يرجى إدخال عنوان المضيف واسم قاعدة البيانات واسم المستخدم بالكامل.',
      });
    }

    const cleanHost = String(host).trim();
    const cleanDb = String(database).trim();
    const cleanUser = String(user).trim();
    const cleanPass = String(password || '');

    // Strict regex validation to block malicious characters, paths, quotes, and semicolons
    if (!/^[a-zA-Z0-9.\-_]+$/.test(cleanHost)) {
      return res.status(400).json({
        ok: false,
        error: 'عنوان المضيف (Host) غير صالح. يُسمح فقط بالأحرف الإنجليزية، الأرقام، والنقاط والشرطات.',
      });
    }

    const portNum = parseInt(String(port), 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({
        ok: false,
        error: 'منفذ الاتصال (Port) يجب أن يكون رقماً صحيحاً بين 1 و 65535.',
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanDb)) {
      return res.status(400).json({
        ok: false,
        error: 'اسم قاعدة البيانات (DB Name) غير صالح. يُسمح فقط بالأحرف والأرقام الإنجليزية والشرطة السفلية (_).',
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      return res.status(400).json({
        ok: false,
        error: 'اسم المستخدم (User) غير صالح. يُسمح فقط بالأحرف والأرقام الإنجليزية والشرطة السفلية (_).',
      });
    }

    if (cleanPass.includes('\0') || cleanPass.length > 512) {
      return res.status(400).json({
        ok: false,
        error: 'كلمة المرور تحتوي على أحرف غير مسموح بها أو تتجاوز الطول الأقصى.',
      });
    }

    // Auto-provision user role and database on local PostgreSQL if not already present
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      await autoProvisionLocalTenant({
        mode: 'custom_tenant',
        tenantId: cleanDb,
        tenantName: cleanDb,
        host: cleanHost,
        port: portNum,
        database: cleanDb,
        user: cleanUser,
        password: cleanPass,
      });
    }

    const client = new pg.Client({
      host: cleanHost,
      port: portNum,
      database: cleanDb,
      user: cleanUser,
      password: cleanPass,
      ssl: ssl === true || ssl === 'true' ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 7000,
    });

    const start = Date.now();
    await client.connect();
    const verRes = await client.query('SELECT version() as ver, current_database() as db;');
    const tablesRes = await client.query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';");
    const latency = Date.now() - start;
    const tablesCount = parseInt(tablesRes.rows[0]?.count || '0', 10);
    await client.end();

    return res.json({
      ok: true,
      latency,
      database: verRes.rows[0]?.db,
      version: verRes.rows[0]?.ver?.split(',')[0],
      tablesCount,
      message: 'تم الاتصال بقاعدة البيانات بنجاح تام!',
    });
  } catch (err: any) {
    console.error('Setup test-db error:', err?.message || err);
    return res.status(400).json({
      ok: false,
      error: err?.message || 'فشل الاتصال بخادم قاعدة البيانات. يرجى التأكد من تشغيل السيرفر وصحة البيانات.',
    });
  }
});

// 3. Save DB configuration and auto-provision tables
app.post('/api/setup/save-db-config', async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;

    if (!host || !database || !user) {
      return res.status(400).json({
        ok: false,
        error: 'يرجى إكمال كافة حقول الاتصال بقاعدة البيانات.',
      });
    }

    const cleanHost = String(host).trim();
    const cleanDb = String(database).trim();
    const cleanUser = String(user).trim();
    const cleanPass = String(password || '');

    if (!/^[a-zA-Z0-9.\-_]+$/.test(cleanHost) || !/^[a-zA-Z0-9_]+$/.test(cleanDb) || !/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      return res.status(400).json({
        ok: false,
        error: 'المدخلات تحتوي على رموز غير مسموح بها لحماية أمان قاعدة البيانات.',
      });
    }

    const portNum = parseInt(String(port), 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({
        ok: false,
        error: 'منفذ الاتصال (Port) غير صالح.',
      });
    }

    // Auto-provision user role and database on local PostgreSQL if not already present
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      await autoProvisionLocalTenant({
        mode: 'custom_tenant',
        tenantId: cleanDb,
        tenantName: cleanDb,
        host: cleanHost,
        port: portNum,
        database: cleanDb,
        user: cleanUser,
        password: cleanPass,
      });
    }

    // Save to .env and active runtime environment
    updateEnvFile({
      SQL_HOST: cleanHost,
      SQL_PORT: String(portNum),
      SQL_DB_NAME: cleanDb,
      SQL_USER: cleanUser,
      SQL_PASSWORD: cleanPass,
      SQL_SSL: ssl === true || ssl === 'true' ? 'true' : 'false',
    });

    // Reinitialize pool
    await resetPool();

    // Auto-provision core 12 tables
    const tableResult = await ensureCoreTablesExist();

    return res.json({
      ok: true,
      message: 'تم حفظ إعدادات قاعدة البيانات وتهيئة الجداول بنجاح!',
      tablesReady: tableResult.ok,
    });
  } catch (err: any) {
    console.error('Setup save-db-config error:', err?.message || err);
    return res.status(500).json({
      ok: false,
      error: err?.message || 'فشل حفظ إعدادات قاعدة البيانات.',
    });
  }
});

// ==========================================
// ADMIN SECURITY & ACCESS CONTROL MIDDLEWARE
// ==========================================
const getAdminSecurityKey = (): string => {
  return process.env.ADMIN_SECURITY_KEY || 'orbix_enterprise_sec_2026';
};

const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = getAdminSecurityKey();
  const providedHeaderKey = req.headers['x-orbix-admin-key'];
  const authHeader = req.headers.authorization;
  const queryKey = req.query.key as string | undefined;

  // 1. Direct admin security key in custom header
  if (providedHeaderKey && providedHeaderKey === adminKey) {
    return next();
  }

  // 2. Query parameter key (used for secure direct file download links)
  if (queryKey && queryKey === adminKey) {
    return next();
  }

  // 3. Authorization Bearer header
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === adminKey) {
    return next();
  }

  // 4. Local loopback requests from the host machine itself (Electron / Localhost developer)
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const isLocalhost =
    clientIp.includes('127.0.0.1') ||
    clientIp.includes('::1') ||
    clientIp.includes('::ffff:127.0.0.1') ||
    clientIp === 'localhost';

  if (isLocalhost) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'غير مصرح: هذه العملية الحساسة تتطلب صلاحيات المشرف ومفتاح الأمان (X-Orbix-Admin-Key).',
  });
};

// Strict Path Traversal Protection for Backup Filenames
const isValidBackupFilename = (filename: string): boolean => {
  if (!filename || typeof filename !== 'string') return false;
  const clean = path.basename(filename);
  if (clean !== filename) return false; // Prevent directory path traversal
  // Filename must strictly match orbix_backup_... .sql or .json
  return /^orbix_backup_[0-9A-Za-z_\-]+\.(sql|json)$/.test(clean);
};

app.post('/api/tenant/init-schema', requireAdminAuth, async (req, res) => {
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

// ==========================================
// AUTOMATED DATABASE BACKUP & RESTORE ENGINE
// ==========================================
const backupsDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// 1. Create Backup (PostgreSQL pg_dump with Cloud State fallback)
app.post('/api/backup/create', requireAdminAuth, async (_req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `orbix_backup_${timestamp}.sql`;
    const targetFile = path.join(backupsDir, filename);

    const pgDumpExecutable = path.resolve(process.cwd(), 'PostgreSQL/18/bin/pg_dump.exe');
    const host = process.env.SQL_HOST || 'localhost';
    const port = process.env.SQL_PORT || '5432';
    const user = process.env.SQL_USER || 'postgres';
    const password = process.env.SQL_PASSWORD || '123';
    const dbName = process.env.SQL_DB_NAME || 'orbix_erp';

    if (fs.existsSync(pgDumpExecutable)) {
      await execFileAsync(
        pgDumpExecutable,
        ['-h', host, '-p', port, '-U', user, '-d', dbName, '-F', 'p', '-f', targetFile],
        { env: { ...process.env, PGPASSWORD: password } }
      );
    } else {
      const state = await getSyncPayload('orbix_erp_cloud_snapshot');
      fs.writeFileSync(targetFile.replace('.sql', '.json'), JSON.stringify(state || {}, null, 2), 'utf8');
    }

    const actualFile = fs.existsSync(targetFile) ? targetFile : targetFile.replace('.sql', '.json');
    const stats = fs.existsSync(actualFile) ? fs.statSync(actualFile) : null;
    const finalName = path.basename(actualFile);

    res.json({
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح وحفظها في مجلد backups',
      backup: {
        filename: finalName,
        size: stats?.size || 0,
        createdAt: stats?.mtime?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Backup creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'فشل إنشاء النسخة الاحتياطية' });
  }
});

// 2. List all backup files
app.get('/api/backup/list', (_req, res) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, backups: [] });
    }
    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter((f) => f.endsWith('.sql') || f.endsWith('.json'))
      .map((f) => {
        const fullPath = path.join(backupsDir, f);
        const st = fs.statSync(fullPath);
        return {
          filename: f,
          size: st.size,
          createdAt: st.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, backups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Download backup file
app.get('/api/backup/download/:filename', requireAdminAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    if (!isValidBackupFilename(filename)) {
      return res.status(400).json({ error: 'اسم ملف النسخة غير صالح أو غير مسموح به' });
    }
    const safeFilename = path.basename(filename);
    const target = path.join(backupsDir, safeFilename);
    if (!fs.existsSync(target)) {
      return res.status(404).json({ error: 'ملف النسخة غير موجود' });
    }
    res.download(target, safeFilename);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Restore backup file
app.post('/api/backup/restore', requireAdminAuth, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename || !isValidBackupFilename(filename)) {
      return res.status(400).json({ success: false, error: 'اسم ملف النسخة غير صالح أو غير مسموح به' });
    }
    const safeFilename = path.basename(filename);
    const targetFile = path.join(backupsDir, safeFilename);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ success: false, error: 'ملف النسخة الاحتياطية غير موجود' });
    }

    const psqlExecutable = path.resolve(process.cwd(), 'PostgreSQL/18/bin/psql.exe');
    const host = process.env.SQL_HOST || 'localhost';
    const port = process.env.SQL_PORT || '5432';
    const user = process.env.SQL_USER || 'postgres';
    const password = process.env.SQL_PASSWORD || '123';
    const dbName = process.env.SQL_DB_NAME || 'orbix_erp';

    if (fs.existsSync(psqlExecutable) && safeFilename.endsWith('.sql')) {
      await execFileAsync(
        psqlExecutable,
        ['-h', host, '-p', port, '-U', user, '-d', dbName, '-f', targetFile],
        { env: { ...process.env, PGPASSWORD: password } }
      );
    } else if (safeFilename.endsWith('.json')) {
      const raw = fs.readFileSync(targetFile, 'utf8');
      const payload = JSON.parse(raw);
      await setSyncPayload('orbix_erp_cloud_snapshot', payload);
    }

    res.json({ success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح وتحديث قاعدة البيانات' });
  } catch (error: any) {
    console.error('Backup restore error:', error);
    res.status(500).json({ success: false, error: error.message || 'فشل استعادة النسخة الاحتياطية' });
  }
});

// 5. Delete backup file
app.delete('/api/backup/:filename', requireAdminAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    if (!isValidBackupFilename(filename)) {
      return res.status(400).json({ success: false, error: 'اسم ملف النسخة غير صالح أو غير مسموح به' });
    }
    const safeFilename = path.basename(filename);
    const target = path.join(backupsDir, safeFilename);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
    res.json({ success: true, message: 'تم حذف ملف النسخة الاحتياطية بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Status & Configuration Endpoints
app.get('/api/ai/status', (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  const isConfigured = !!key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY';
  res.json({
    configured: isConfigured,
    model: 'gemini-3.6-flash',
    maskedKey: isConfigured ? `${key.slice(0, 5)}...${key.slice(-4)}` : null,
  });
});

app.post('/api/ai/config', requireAdminAuth, (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({ error: 'مفتاح API مطلوب' });
    }
    const cleanKey = apiKey.trim();
    process.env.GEMINI_API_KEY = cleanKey;

    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${cleanKey}`);
      } else {
        content += `\nGEMINI_API_KEY=${cleanKey}\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }

    res.json({
      success: true,
      message: 'تم حفظ وتفعيل مفتاح الذكاء الاصطناعي بنجاح',
      maskedKey: `${cleanKey.slice(0, 5)}...${cleanKey.slice(-4)}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'فشل حفظ مفتاح API' });
  }
});

// AI Financial & Operations Advisor Endpoint (Gemini + Offline Intelligent Engine)
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'الاستفسار مطلوب' });
    }

    const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        const systemInstruction = `أنت "Orbix AI" المستشار المالي والمحاسبي الذكي المدمج في نظام Orbix ERP Enterprise.
أجب باحترافية عالية باللغة العربية، بأسلوب عملي ودقيق ومباشر.
لديك البيانات المحاسبية والتشغيلية التالية للنظام:
${JSON.stringify(context || {}, null, 2)}
حلل الأرقام بدقة، وقدم إجابة منسقة وواضحة، مع توصيات مالية وإدارية قابلة للتطبيق مباشرة.`;

        // Support modern candidate models in priority order
        const candidateModels = [
          'gemini-3.6-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
        ];

        let lastError: any = null;
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: `${systemInstruction}\n\nسؤال المستخدم: ${prompt}`,
            });

            const reply = response.text;
            if (reply) {
              return res.json({ success: true, reply, source: `gemini (${model})` });
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            console.warn(`[AI] Model ${model} unavailable (${modelErr.message}), trying next fallback...`);
          }
        }

        console.warn('[AI] All generative models failed, falling back to local advisor:', lastError?.message);
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local advisor:', geminiError.message);
      }
    }

    // Built-in Intelligent Rule-based Financial Advisor (Zero external dependency fallback)
    const salesCount = context?.salesInvoicesCount || 0;
    const totalRevenue = context?.totalRevenue || 0;
    const lowStockCount = context?.lowStockCount || 0;
    const customersCount = context?.customersCount || 0;
    const currency = context?.currency || 'ج.م';

    let localReply = '';
    const q = prompt.toLowerCase();

    if (q.includes('مبيعات') || q.includes('أرباح') || q.includes('ارباح') || q.includes('دخل')) {
      localReply = `📊 **ملخص الأداء المالي والمبيعات:**\n- إجمالي عدد الفواتير الصادرة: **${salesCount}** فاتورة.\n- حجم الإيرادات التراكمي: **${Number(totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}**.\n- متوسط قيمة الفاتورة: **${salesCount > 0 ? (totalRevenue / salesCount).toFixed(2) : 0} ${currency}**.\n\n💡 **التوصية الإدارية:** نوصي بمراجعة تقرير هوامش الربح وتقديم عروض ترويجية للأصناف الأكثر طلباً لزيادة متوسط السلة الشرائية.`;
    } else if (q.includes('مخزون') || q.includes('نواقص') || q.includes('راكد') || q.includes('بضاعة')) {
      localReply = `📦 **تحليل المخزون والمستودعات:**\n- عدد الأصناف التي قاربت على النفاد (وصلت لحد الطلب): **${lowStockCount}** صنف.\n\n⚠️ **تنبيه:** يوجد أصناف حرجة تحتاج لإصدار أوامر شراء عاجلة لتجنب توقف المبيعات.\n💡 **التوصية:** قم بزيارة وحدة المشتريات > أوامر الشراء لإنشاء طلبية فورية للموردين.`;
    } else if (q.includes('عملاء') || q.includes('تحصيل') || q.includes('ديون') || q.includes('مديونية')) {
      localReply = `👥 **تحليل العملاء والتحصيل (CRM):**\n- إجمالي عدد العملاء المسجلين: **${customersCount}** عميل.\n\n💡 **التوصية:** متابعة خطط التحصيل الدورية في شاشة الـ CRM، واستخدام ميزة "إرسال كشوف الحساب والفواتير عبر واتساب" للتواصل الودي والمبكر مع كبار العملاء لتسريع دورة رأس المال.`;
    } else {
      localReply = `💡 **تحليل استشاري ذكي لنظام Orbix ERP:**\nبناءً على المعطيات الحالية للمنشأة:\n- حجم المبيعات الإجمالي: **${Number(totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}** عبر **${salesCount}** فاتورة.\n- الأصناف الحرجة بالمخزن: **${lowStockCount}** صنف.\n- العملاء النشطون: **${customersCount}** عميل.\n\n📌 *ملاحظة:* للحصول على تحليلات توليدية عميقة ومخصصة، يمكنك وضع مفتاح \`GEMINI_API_KEY\` في ملف \`.env\` وسيعمل الذكاء الاصطناعي التوليدي تلقائياً!`;
    }

    return res.json({ success: true, reply: localReply, source: 'local_advisor' });
  } catch (error: any) {
    console.error('Error in AI advisor endpoint:', error);
    res.status(500).json({ error: error.message || 'فشل معالجة الاستفسار' });
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
  // Ensure all 12 core PostgreSQL database tables exist on server boot
  try {
    await ensureCoreTablesExist();
  } catch (err: any) {
    console.warn('Initial database auto-provisioning warning:', err.message);
  }

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
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
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
