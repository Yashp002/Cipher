@echo off
echo ========================================
echo   Installing Python Bridge Dependencies
echo ========================================

cd /d "%~dp0"

REM Install dependencies directly with pip
echo Installing packages...
pip install flask==3.0.0 flask-cors==4.0.0 pyautogui==0.9.54 opencv-python==4.9.0.80 numpy==1.26.3 Pillow==10.2.0 mss==9.0.1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Installation failed!
    echo Make sure Python and pip are installed.
    echo Try: python -m pip install --upgrade pip
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo Now run: python server.py
echo Or just run: npm run dev
pause
