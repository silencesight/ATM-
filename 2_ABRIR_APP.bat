@echo off
chcp 65001 >nul
title English Classroom Credit Cards
cd /d "%~dp0"

if not exist "node_modules" (
    echo Todavia no instalaste la app.
    echo Haz doble clic primero en "1_INSTALAR (una sola vez).bat"
    echo.
    pause
    exit /b 1
)

if not exist "dist" (
    echo Todavia no se compilo la app.
    echo Haz doble clic primero en "1_INSTALAR (una sola vez).bat"
    echo.
    pause
    exit /b 1
)

echo Iniciando la app ^(no necesita internet^)...
start "Credit Card App - servidor (no cerrar)" cmd /c "npm run preview"
timeout /t 2 /nobreak >nul
start "" http://localhost:4173

echo.
echo La app se abrio en tu navegador.
echo.
echo Se abrio otra ventana llamada "Credit Card App - servidor":
echo esa ventana debe quedar abierta ^(puedes minimizarla^) mientras
echo uses la app. Cierrala solo cuando termines de usarla.
echo.
echo Puedes cerrar esta ventana ahora.
pause
exit /b 0
