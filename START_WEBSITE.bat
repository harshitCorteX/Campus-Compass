@echo off
cd /d "%~dp0"
echo.
echo  CAMPUS COMPASS - University AI project
echo  Open http://127.0.0.1:8000 in your browser after the server starts.
echo  Keep this window open during the demonstration.
echo.
python server.py
if errorlevel 1 pause
