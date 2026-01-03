@echo off
echo ====================================
echo Sistema de Ventas - Build Installer
echo ====================================
echo.

echo [1/3] Instalando dependencias...
call npm install
if errorlevel 1 goto error

echo.
echo [2/3] Construyendo aplicacion...
call npm run build:all
if errorlevel 1 goto error

echo.
echo [3/3] Creando instalador...
call npm run electron:build
if errorlevel 1 goto error

echo.
echo ====================================
echo BUILD COMPLETADO!
echo ====================================
echo.
echo El instalador esta en: release\
echo Archivo: Sistema de Ventas Setup 1.0.0.exe
echo.
pause
goto end

:error
echo.
echo ====================================
echo ERROR EN EL BUILD
echo ====================================
echo.
pause
exit /b 1

:end
