' ==============================================================================
' Orbix ERP Enterprise - Silent Desktop Launcher (VBScript)
' Launches Electron Desktop Edition completely silently without ANY CMD windows
' ==============================================================================

Option Explicit

Dim fso, WshShell, scriptDir, pgCtl, pgData, pidFile, electronExe, electronCmd, envVars, i

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' 1. Clear any ELECTRON_RUN_AS_NODE environment variable to guarantee GUI mode
On Error Resume Next
Set envVars = WshShell.Environment("PROCESS")
envVars.Remove("ELECTRON_RUN_AS_NODE")
On Error GoTo 0

' 2. Check and start PostgreSQL silently if installed locally
pgCtl = scriptDir & "\PostgreSQL\18\bin\pg_ctl.exe"
pgData = scriptDir & "\PostgreSQL\18\data"
pidFile = pgData & "\postmaster.pid"

If fso.FileExists(pgCtl) Then
    Dim psPgCmd
    psPgCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command """ & _
              "$f = '" & pidFile & "'; " & _
              "if (Test-Path $f) { " & _
              "    $pidVal = (Get-Content $f -TotalCount 1).Trim(); " & _
              "    if ($pidVal -and -not (Get-Process -Id $pidVal -ErrorAction SilentlyContinue)) { Remove-Item $f -Force -ErrorAction SilentlyContinue } " & _
              "}; " & _
              "& '" & pgCtl & "' status -D '" & pgData & "' > $null 2>&1; " & _
              "if ($LASTEXITCODE -ne 0) { & '" & pgCtl & "' start -D '" & pgData & "' -w > $null 2>&1 }" & _
              """"
    WshShell.Run psPgCmd, 0, True
End If

' 3. Helper to check server health on port 3000
Function CheckServerHealthy()
    On Error Resume Next
    Dim xmlHttp
    Set xmlHttp = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    xmlHttp.setTimeouts 1500, 1500, 1500, 1500
    xmlHttp.open "GET", "http://127.0.0.1:3000/api/health", False
    xmlHttp.send
    If Err.Number = 0 Then
        CheckServerHealthy = (xmlHttp.status = 200)
    Else
        CheckServerHealthy = False
    End If
    Set xmlHttp = Nothing
    On Error GoTo 0
End Function

' 4. Ensure Node server is running silently
If Not CheckServerHealthy() Then
    If fso.FileExists(scriptDir & "\dist\server.cjs") Then
        WshShell.Run "node """ & scriptDir & "\dist\server.cjs""", 0, False
    Else
        WshShell.Run "cmd.exe /c npm run dev", 0, False
    End If
    
    ' Wait briefly for the server to bind (up to 6 seconds)
    For i = 1 To 24
        WScript.Sleep 250
        If CheckServerHealthy() Then Exit For
    Next
End If

' 5. Resolve path to electron executable and launch GUI
electronExe = scriptDir & "\node_modules\electron\dist\electron.exe"

If fso.FileExists(electronExe) Then
    ' Launch Electron directly as a native Windows GUI app (1 = Show normal GUI window, electron.exe is GUI-native so 0 console)
    WshShell.Run """" & electronExe & """ """ & scriptDir & "\electron\main.cjs""", 1, False
Else
    ' Fallback to electron.cmd or web launcher
    electronCmd = scriptDir & "\node_modules\.bin\electron.cmd"
    If fso.FileExists(electronCmd) Then
        WshShell.Run "cmd.exe /c """"" & electronCmd & """ """ & scriptDir & "\electron\main.cjs""""", 0, False
    Else
        WshShell.Run "http://localhost:3000", 1, False
    End If
End If
