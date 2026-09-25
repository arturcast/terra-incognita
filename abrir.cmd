@echo off
rem Terra Incognita - lanzador del stand.
rem WebHID exige contexto seguro: localhost lo es; abrir el .html directo NO.
rem servidor.py sirve sin cache: cada recarga trae el codigo actual.
cd /d "%~dp0"
echo.
echo   TERRA INCOGNITA
echo.
start "" chrome.exe --start-fullscreen "http://localhost:8740/index.html"
python servidor.py
