@echo off
rem Terra Incognita - lanzador del stand (Windows).
rem WebHID exige contexto seguro: localhost lo es; abrir el .html directo NO.
rem servidor.py sirve sin cache y, cuando ya esta escuchando, abre Chrome
rem (antes se abria Chrome primero y en un PC lento salia ERR_CONNECTION_REFUSED).
cd /d "%~dp0"
chcp 65001 >nul
echo.
echo   TERRA INCOGNITA
echo.

rem Buscar Python: primero el lanzador "py", luego "python". El "python" de la
rem Microsoft Store (el atajo que abre la tienda) no sirve: se prueba de verdad.
set "PY="
where py >nul 2>nul && py -3 -c "import sys" >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && python -c "import sys" >nul 2>nul && set "PY=python"
if not defined PY goto sinpython

%PY% servidor.py --abrir
if errorlevel 1 goto error
goto fin

:sinpython
echo   No se encontro Python en este computador, y el juego lo necesita
echo   para funcionar (es un servidor pequeno, no se instala nada mas).
echo.
echo   1. Descargalo de https://www.python.org/downloads/
echo   2. Al instalar, marca la casilla "Add python.exe to PATH".
echo   3. Vuelve a abrir este archivo.
echo.
start "" "https://www.python.org/downloads/"
pause
goto fin

:error
echo.
echo   El servidor se detuvo con un error (arriba esta el motivo).
pause

:fin
