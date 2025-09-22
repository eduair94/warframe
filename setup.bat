@echo off
setlocal

:: Warframe Market Analytics Setup Script for Windows
:: This script helps set up the development environment

echo 🚀 Setting up Warframe Market Analytics...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% is installed

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

:: Get npm version
for /f %%i in ('npm -v') do set NPM_VERSION=%%i
echo [SUCCESS] npm %NPM_VERSION% is installed

:: Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB doesn't appear to be running. Make sure to start MongoDB before running the application.
) else (
    echo [SUCCESS] MongoDB is running
)

echo.
echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

echo.
echo [INFO] Installing frontend dependencies...
cd app
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Frontend dependencies installed

:: Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy .env.example .env >nul
    echo [SUCCESS] .env file created. Please edit it with your configuration.
    echo [WARNING] Don't forget to configure your MongoDB URI and other settings in .env
) else (
    echo [SUCCESS] .env file already exists
)

:: Create proxy directories
echo [INFO] Creating proxy directories...
if not exist proxies mkdir proxies
type nul > proxies\banned.txt
type nul > proxies\usa_banned.txt
type nul > proxies\idx.txt
echo [SUCCESS] Proxy directories created
echo [WARNING] Note: You'll need to create proxies\proxies.txt and proxies\usa_proxies.txt manually if using proxies

echo.
echo [INFO] Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build the application
    pause
    exit /b 1
)
echo [SUCCESS] Application built successfully

echo.
echo [SUCCESS] 🎉 Setup completed successfully!
echo.
echo [INFO] Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Make sure MongoDB is running
echo 3. Run 'npm run sync_items' to initialize the database
echo 4. Run 'npm run dev' to start the development server
echo 5. Run 'cd app && npm run dev' to start the frontend
echo.
echo [INFO] For production deployment, use 'npm run pm2:start'
echo.
echo [INFO] Visit the README.md for detailed documentation
echo.
pause
