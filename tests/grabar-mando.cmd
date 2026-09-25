@echo off
rem Graba el Joy-Con real para validar el juego. Ver tests/captura.py.
cd /d "%~dp0.."
echo.
echo   GRABACION DEL MANDO
echo   Cierra el juego en Chrome antes de seguir y pulsa un boton de cada Joy-Con para despertarlos.
echo.
pause
python tests\captura.py
echo.
pause
