' ==============================================================================
' Orbix ERP Enterprise - Modern Desktop Splash Launcher (VBScript)
' Launches the hardware-accelerated WPF Preloader & System Orchestration
' completely silently without any black CMD console windows
' ==============================================================================

Option Explicit

Dim fso, WshShell, scriptDir, splashScript, launchCmd

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

splashScript = scriptDir & "\scripts\launch-with-splash.ps1"

If fso.FileExists(splashScript) Then
    ' Launch the native modern WPF preloader silently and let it orchestrate startup
    launchCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & splashScript & """"
    WshShell.Run launchCmd, 0, True
Else
    ' Fallback to direct URL if script is absent
    WshShell.Run "http://localhost:3000"
End If
