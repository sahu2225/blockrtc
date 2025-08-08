@echo off
echo Clearing Next.js cache...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cache cleared!
echo.
echo Restarting development server...
npm run dev