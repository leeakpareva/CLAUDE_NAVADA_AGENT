' Silent task runner - launches run-task.bat without a visible window
' Usage: wscript run-task-hidden.vbs <task-name> <command> [args...]
' Called by Windows Task Scheduler to prevent terminal flickering

Dim args, cmd, i
Set shell = CreateObject("WScript.Shell")

' Build the argument string from all passed arguments
cmd = ""
For i = 0 To WScript.Arguments.Count - 1
    cmd = cmd & " " & WScript.Arguments(i)
Next

' Run the batch file hidden (0 = hidden window, False = don't wait)
shell.Run "cmd /c ""C:\Users\leeak\Alex\Automation\run-task.bat" & cmd & """", 0, False
