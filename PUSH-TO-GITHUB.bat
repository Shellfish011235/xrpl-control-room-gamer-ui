@echo off
echo Pushing to GitHub...
cd /d "%~dp0"
git push origin main
echo.
if %errorlevel%==0 (
    echo SUCCESS! Your code is now on GitHub.
) else (
    echo Push failed. You may need to authenticate.
    echo Try: git push origin main
)
pause
