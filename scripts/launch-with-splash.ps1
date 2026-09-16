# ==============================================================================
# Orbix ERP Enterprise - Native Desktop Splash & System Launcher
# Hardware-accelerated WPF Splash Window with live PostgreSQL & Node.js orchestration
# Pure ASCII Source - 100% Compatible with all Windows PowerShell Encodings
# ==============================================================================

param(
    [switch]$DesktopMode = $false
)

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
if (-not (Test-Path "$rootDir\package.json")) {
    $rootDir = $scriptDir
}

# Arabic Localization Strings (Decoded safely from UTF-8 Base64)
$msg_subtitle       = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KfZhNmF2YbYuNmI2YXYqSDYp9mE2YXYrdin2LPYqNmK2Kkg2KfZhNiz2K3Yp9io2YrYqSDYp9mE2LDZg9mK2Kk="))
$msg_init           = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KzYp9ix2Yog2KXYudiv2KfYryDYqNmK2KbYqSDYp9mE2YbYuNin2YUuLi4="))
$msg_step0          = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KzYp9ix2Yog2KfZhNiq2K3ZgtmCINmF2YYg2YXYrdix2YMg2YLZiNin2LnYryDYp9mE2KjZitin2YbYp9iqIFBvc3RncmVTUUwuLi4="))
$msg_step1          = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KjYr9ihINiq2LTYutmK2YQg2K7Yr9mF2KkgUG9zdGdyZVNRTCDYp9mE2YXYrdmE2YrYqS4uLg=="))
$msg_step2          = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2YHYrdi1INiu2KfYr9mFINij2YjYsdio2YPYsyDZiNmF2K3YsdmDINin2YTYrtiv2YXYp9iqLi4u"))
$msg_alreadyRunning = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KfZhNmG2LjYp9mFINmC2YrYryDYp9mE2KrYtNi62YrZhCDYqNin2YTZgdi52YQhINis2KfYsdmKINmB2KrYrSDYp9mE2YjYp9is2YfYqS4uLg=="))
$msg_step3          = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KrYtNi62YrZhCDYrtin2K/ZhSDYo9mI2LHYqNmD2LMg2KfZhNiz2K3Yp9io2YogKE5vZGUuanMpLi4u"))
$msg_step4Prefix    = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KzYp9ix2Yog2KfZhNin2KrYtdin2YQg2KjYrtin2K/ZhSDYp9mE2YbYuNin2YU="))
$msg_step4Ready     = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KrZhSDYqNiv2KEg2KrYtNi62YrZhCDYp9mE2YbYuNin2YUg2KjZhtis2KfYrSEg2KzYp9ix2Yog2YHYqtitINin2YTZiNin2KzZh9ipLi4u"))
$msg_step4Timeout   = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("2KrZhtio2YrZhzog2KzYp9ix2Yog2YHYqtitINmI2KfYrNmH2Kkg2KfZhNmG2LjYp9mFLi4u"))

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Orbix ERP"
        Height="340" Width="480"
        WindowStyle="None"
        AllowsTransparency="True"
        Background="Transparent"
        WindowStartupLocation="CenterScreen"
        Topmost="True"
        ShowInTaskbar="True">
    <Window.Resources>
        <Style TargetType="ProgressBar">
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="ProgressBar">
                        <Grid>
                            <Border Background="#1e293b" CornerRadius="4" BorderThickness="1" BorderBrush="#334155" />
                            <Border Name="PART_Indicator" HorizontalAlignment="Left" CornerRadius="4">
                                <Border.Background>
                                    <LinearGradientBrush StartPoint="0,0" EndPoint="1,0">
                                        <GradientStop Color="#10b981" Offset="0.0" />
                                        <GradientStop Color="#06b6d4" Offset="1.0" />
                                    </LinearGradientBrush>
                                </Border.Background>
                            </Border>
                        </Grid>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>

    <Border CornerRadius="22" BorderThickness="1.5" Margin="10">
        <Border.BorderBrush>
            <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
                <GradientStop Color="#5010b981" Offset="0.0" />
                <GradientStop Color="#2506b6d4" Offset="1.0" />
            </LinearGradientBrush>
        </Border.BorderBrush>
        <Border.Background>
            <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
                <GradientStop Color="#0f172a" Offset="0.0" />
                <GradientStop Color="#020617" Offset="1.0" />
            </LinearGradientBrush>
        </Border.Background>
        <Border.Effect>
            <DropShadowEffect Color="#10b981" BlurRadius="28" ShadowDepth="0" Opacity="0.35" />
        </Border.Effect>

        <Grid Margin="24,18,24,16">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="Auto" />
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
                <RowDefinition Height="Auto" />
                <RowDefinition Height="Auto" />
            </Grid.RowDefinitions>

            <!-- Top Header & Close Button -->
            <Grid Grid.Row="0" Margin="0,0,0,10">
                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                    <Border Background="#1510b981" BorderBrush="#4010b981" BorderThickness="1" CornerRadius="12" Padding="12,3">
                        <StackPanel Orientation="Horizontal">
                            <Ellipse Width="6" Height="6" Fill="#10b981" Margin="0,0,6,0" VerticalAlignment="Center" />
                            <TextBlock Text="ORBIX SYSTEM LAUNCHER" Foreground="#10b981" FontSize="10" FontWeight="Bold" FontFamily="Segoe UI" />
                        </StackPanel>
                    </Border>
                </StackPanel>
                <Button Name="btnClose" Content="X" Width="22" Height="22" HorizontalAlignment="Right" VerticalAlignment="Center"
                        Background="Transparent" Foreground="#64748b" BorderThickness="0" FontSize="11" FontWeight="Bold" Cursor="Hand">
                    <Button.Style>
                        <Style TargetType="Button">
                            <Setter Property="Template">
                                <Setter.Value>
                                    <ControlTemplate TargetType="Button">
                                        <Border Background="{TemplateBinding Background}" CornerRadius="11">
                                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                                        </Border>
                                    </ControlTemplate>
                                </Setter.Value>
                            </Setter>
                        </Style>
                    </Button.Style>
                </Button>
            </Grid>

            <!-- Center Logo / Emblem -->
            <StackPanel Grid.Row="1" HorizontalAlignment="Center" Margin="0,0,0,10">
                <Border Width="64" Height="64" CornerRadius="18" Padding="6" Background="#0f172a" BorderBrush="#3010b981" BorderThickness="1.5">
                    <Border.Effect>
                        <DropShadowEffect Color="#10b981" BlurRadius="22" ShadowDepth="0" Opacity="0.5" />
                    </Border.Effect>
                    <Image Name="imgLogo" Width="48" Height="48" Stretch="Uniform" HorizontalAlignment="Center" VerticalAlignment="Center" RenderOptions.BitmapScalingMode="HighQuality" />
                </Border>
            </StackPanel>

            <!-- Titles -->
            <StackPanel Grid.Row="2" HorizontalAlignment="Center" Margin="0,0,0,12">
                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                    <TextBlock Text="ORBIX " Foreground="#FFFFFF" FontSize="22" FontWeight="ExtraBold" FontFamily="Segoe UI" />
                    <TextBlock Text="ERP" Foreground="#10b981" FontSize="22" FontWeight="ExtraBold" FontFamily="Segoe UI" />
                </StackPanel>
                <TextBlock Name="txtSubtitle" Text="" Foreground="#94a3b8" FontSize="12.5" FontFamily="Segoe UI, Tahoma" HorizontalAlignment="Center" Margin="0,2,0,0" FlowDirection="RightToLeft" />
            </StackPanel>

            <!-- Spacer Row 3 -->
            <Grid Grid.Row="3" />

            <!-- Progress & Live Status (Row 4) -->
            <StackPanel Grid.Row="4" Margin="0,0,0,12">
                <Grid Margin="2,0,2,6">
                    <TextBlock Name="txtStatus" Text="" Foreground="#e2e8f0" FontSize="11.5" FontWeight="SemiBold" FontFamily="Segoe UI, Tahoma" FlowDirection="RightToLeft" HorizontalAlignment="Right" />
                    <TextBlock Name="txtPercent" Text="0%" Foreground="#10b981" FontSize="11.5" FontWeight="Bold" FontFamily="Segoe UI" HorizontalAlignment="Left" />
                </Grid>
                <ProgressBar Name="pbProgress" Height="7" Minimum="0" Maximum="100" Value="0" />
            </StackPanel>

            <!-- Footer Metadata (Row 5) -->
            <Grid Grid.Row="5" Margin="2,0,2,0">
                <TextBlock Text="PostgreSQL 18 • Node.js Engine" Foreground="#475569" FontSize="10" FontFamily="Segoe UI" HorizontalAlignment="Left" />
                <TextBlock Text="v2.5.0 Enterprise" Foreground="#475569" FontSize="10" FontFamily="Segoe UI" HorizontalAlignment="Right" />
            </Grid>
        </Grid>
    </Border>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$window = [System.Windows.Markup.XamlReader]::Load($reader)

$txtSubtitle = $window.FindName("txtSubtitle")
$txtStatus = $window.FindName("txtStatus")
$txtPercent = $window.FindName("txtPercent")
$pbProgress = $window.FindName("pbProgress")
$btnClose = $window.FindName("btnClose")
$imgLogo = $window.FindName("imgLogo")

$iconFile = Join-Path $rootDir "public\icon.png"
if (Test-Path $iconFile) {
    try {
        $bmp = New-Object System.Windows.Media.Imaging.BitmapImage
        $bmp.BeginInit()
        $bmp.UriSource = New-Object System.Uri($iconFile, [System.UriKind]::Absolute)
        $bmp.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        $bmp.EndInit()
        $imgLogo.Source = $bmp
    } catch {}
}

# Set initial localized text
$txtSubtitle.Text = $msg_subtitle
$txtStatus.Text = $msg_init

$btnClose.Add_Click({
    $window.Close()
})

# Function to check server health on port 3000
function Test-OrbixServer {
    try {
        $res = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        return ($res.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# Startup Orchestration State Machine
$script:step = 0
$script:checkCount = 0

$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(250)

$timer.Add_Tick({
    switch ($script:step) {
        0 {
            # Initial step: check PostgreSQL
            $txtStatus.Text = $msg_step0
            $pbProgress.Value = 20
            $txtPercent.Text = "20%"
            $script:step = 1
        }
        1 {
            # Start PostgreSQL if installed locally and not running
            $pgCtl = Join-Path $rootDir "PostgreSQL\18\bin\pg_ctl.exe"
            $pgData = Join-Path $rootDir "PostgreSQL\18\data"
            $pidFile = Join-Path $pgData "postmaster.pid"

            if (Test-Path $pgCtl) {
                if (Test-Path $pidFile) {
                    try {
                        $pidVal = (Get-Content $pidFile -TotalCount 1).Trim()
                        if ($pidVal -and -not (Get-Process -Id $pidVal -ErrorAction SilentlyContinue)) {
                            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
                        }
                    } catch {}
                }
                
                & $pgCtl status -D $pgData > $null 2>&1
                if ($LASTEXITCODE -ne 0) {
                    $txtStatus.Text = $msg_step1
                    $pbProgress.Value = 35
                    $txtPercent.Text = "35%"
                    Start-Process -FilePath $pgCtl -ArgumentList "start -D `"$pgData`" -w" -WindowStyle Hidden -Wait
                }
            }
            $script:step = 2
        }
        2 {
            # Check if Node.js server is already healthy
            $txtStatus.Text = $msg_step2
            $pbProgress.Value = 50
            $txtPercent.Text = "50%"

            if (Test-OrbixServer) {
                # Already running!
                $txtStatus.Text = $msg_alreadyRunning
                $pbProgress.Value = 100
                $txtPercent.Text = "100%"
                $script:step = 5
            } else {
                $script:step = 3
            }
        }
        3 {
            $txtStatus.Text = $msg_step3
            $pbProgress.Value = 65
            $txtPercent.Text = "65%"

            $serverScript = Join-Path $rootDir "dist\server.cjs"
            if (Test-Path $serverScript) {
                Start-Process -FilePath "node" -ArgumentList "`"$serverScript`"" -WorkingDirectory $rootDir -WindowStyle Hidden
            } else {
                Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $rootDir -WindowStyle Hidden
            }
            $script:step = 4
        }
        4 {
            # Polling server health
            $script:checkCount++
            $calcVal = [Math]::Min(95, 65 + ($script:checkCount * 3))
            $pbProgress.Value = $calcVal
            $txtPercent.Text = "$calcVal%"
            $txtStatus.Text = "$msg_step4Prefix ($script:checkCount)..."

            if (Test-OrbixServer) {
                $txtStatus.Text = $msg_step4Ready
                $pbProgress.Value = 100
                $txtPercent.Text = "100%"
                $script:step = 5
            } elseif ($script:checkCount -ge 25) {
                # Timeout fallback
                $txtStatus.Text = $msg_step4Timeout
                $pbProgress.Value = 100
                $txtPercent.Text = "100%"
                $script:step = 5
            }
        }
        5 {
            # Completed step, prepare for launch on next tick
            $script:step = 6
        }
        6 {
            $timer.Stop()
            
            # Launch User Interface
            if ($DesktopMode) {
                $electronCmd = Join-Path $rootDir "node_modules\.bin\electron.cmd"
                $mainCjs = Join-Path $rootDir "electron\main.cjs"
                if (Test-Path $electronCmd) {
                    Start-Process -FilePath $electronCmd -ArgumentList "`"$mainCjs`"" -WorkingDirectory $rootDir
                } else {
                    Start-Process "http://localhost:3000"
                }
            } else {
                Start-Process "http://localhost:3000"
            }

            $window.Close()
        }
    }
})

$window.Add_Loaded({
    $window.Activate()
    $window.Focus()
    $timer.Start()
})

$window.Add_MouseLeftButtonDown({
    $window.DragMove()
})

[void]$window.ShowDialog()
