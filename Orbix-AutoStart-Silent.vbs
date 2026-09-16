Option Explicit

Dim fso, WshShell, scriptDir, autoStartPs1, launchCmd

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

autoStartPs1 = scriptDir & "\scripts\autostart-background.ps1"

If fso.FileExists(autoStartPs1) Then
    launchCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & autoStartPs1 & """"
    WshShell.Run launchCmd, 0, False
End If

