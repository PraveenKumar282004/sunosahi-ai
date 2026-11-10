@echo off
title SunoSahi AI - Gnani AI Hackathon
echo ========================================================
echo   Starting SunoSahi AI Voice Agent Server...
echo ========================================================
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
