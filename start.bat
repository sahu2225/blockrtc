@echo off
echo Installing dependencies...
call npm install

echo Installing server dependencies...
cd server
call npm install
cd ..

echo Starting servers...
echo.
echo Starting Socket.io server on port 3001...
start cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Next.js frontend on port 3000...
start cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo.
echo Make sure MetaMask is installed in your browser!
pause