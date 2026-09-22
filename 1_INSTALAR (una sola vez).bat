@echo off
chcp 65001 >nul
title Instalando - English Classroom Credit Cards
cd /d "%~dp0"

echo ================================================================
echo   English Classroom Credit Cards - Instalacion (solo una vez)
echo   Este paso necesita internet. Los siguientes usos, NO.
echo ================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo No se encontro Node.js en este equipo.
    echo.
    echo Node.js es necesario SOLO para esta instalacion inicial.
    echo 1. Descarga la version "LTS" desde:  https://nodejs.org
    echo 2. Instalala ^(siguiente, siguiente, finalizar^)
    echo 3. Vuelve a hacer doble clic en este archivo
    echo.
    pause
    exit /b 1
)

if exist "node_modules" (
    echo Borrando una instalacion anterior...
    rmdir /s /q "node_modules"
)
if exist "dist" (
    rmdir /s /q "dist"
)

echo Descargando los componentes de la app...
echo ^(esto puede tardar unos minutos la primera vez^)
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ================================================================
    echo   Algo fallo durante la descarga. Revisa tu conexion a internet
    echo   y vuelve a intentarlo haciendo doble clic en este archivo.
    echo ================================================================
    pause
    exit /b 1
)

echo.
echo Compilando la app...
call npm run build
if errorlevel 1 (
    echo.
    echo ================================================================
    echo   Algo fallo al compilar la app. Copia el mensaje de arriba
    echo   si necesitas ayuda para resolverlo.
    echo ================================================================
    pause
    exit /b 1
)

echo.
echo Creando un icono de acceso directo en el Escritorio...
set "SCRIPT=%~dp02_ABRIR_APP.bat"
set "ICON=%~dp0icon_app.ico"
set "SHORTCUT=%USERPROFILE%\Desktop\Credit Card App.lnk"
powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%SHORTCUT%');" ^
  "$s.TargetPath='C:\Windows\System32\cmd.exe';" ^
  "$s.Arguments='/c \"\"%SCRIPT%\"\"';" ^
  "$s.WorkingDirectory='%~dp0';" ^
  "$s.IconLocation='%ICON%';" ^
  "$s.Save()" >nul 2>nul

echo.
echo ================================================================
echo   Listo! Ya no necesitas internet para usar la app.
echo.
echo   Se creo el icono "Credit Card App" en tu Escritorio.
echo   Usalo la proxima vez ^(clic derecho sobre el para anclarlo
echo   al Inicio o a la barra de tareas si quieres^).
echo ================================================================
echo.
echo Abriendo la app ahora...
timeout /t 2 /nobreak >nul
start "" "%SCRIPT%"
exit /b 0
