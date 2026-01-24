Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\anamb\xrpl-control-room-gamer-ui"
WshShell.Run "cmd /k npm run dev", 1, False
WScript.Sleep 8000
WshShell.Run "http://localhost:3000", 1, False
