@echo off
cd /d C:\Users\anamb\xrpl-control-room-gamer-ui
start "" npm run dev
timeout /t 8 /nobreak >nul
start "" http://localhost:3000
