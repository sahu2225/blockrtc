#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Starting servers..."
echo ""
echo "Starting Socket.io server on port 3001..."
cd server && npm run dev &
SERVER_PID=$!
cd ..

sleep 3

echo "Starting Next.js frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are running..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo ""
echo "Make sure MetaMask is installed in your browser!"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $SERVER_PID $FRONTEND_PID; exit" INT
wait