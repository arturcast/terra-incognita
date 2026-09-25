@echo off
rem Lanza JoyCon Lab en Chrome sobre un servidor local.
rem WebHID exige contexto seguro: localhost lo es, por eso no se abre el archivo directo.
cd /d "%~dp0"
set PORT=8730
start "" chrome.exe "http://localhost:%PORT%/index.html"
python -m http.server %PORT% --bind 127.0.0.1
