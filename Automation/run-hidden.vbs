' Run any command silently (no visible terminal window)
' Usage: wscript run-hidden.vbs <full command to run>
' Example: wscript run-hidden.vbs node script.js
' Example: wscript run-hidden.vbs py script.py

Dim args, i
args = ""
For i = 0 To WScript.Arguments.Count - 1
    If InStr(WScript.Arguments(i), " ") > 0 Then
        args = args & " """ & WScript.Arguments(i) & """"
    Else
        args = args & " " & WScript.Arguments(i)
    End If
Next

CreateObject("WScript.Shell").Run "cmd /c" & args, 0, True
