@echo off
REM Push to GitHub and let Vercel auto-deploy (or run vercel --prod if needed).
REM Run from project root. If push fails, try: git config --global --unset http.proxy
cd /d "%~dp0"

echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
  echo Push failed. Try: git config --global --unset http.proxy
  pause
  exit /b 1
)

echo.
echo Push succeeded. If Vercel is linked to this repo, it will auto-deploy.
echo To force deploy: npx vercel --prod
pause
