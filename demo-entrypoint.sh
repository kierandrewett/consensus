#!/bin/sh

DATA_DIR="${DATA_DIR:-/app/data}"
DB_FILE="$DATA_DIR/database.sqlite"
RESET_INTERVAL="${DB_RESET_INTERVAL_SECONDS:-86400}"
PORT="${PORT:-3000}"

reset_database() {
    echo "[Demo] Resetting database..."
    rm -f "$DB_FILE"
    node dist/seed.js
    echo "[Demo] Database reset complete"
}

kill_port() {
    # Find and kill any process listening on the port
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "[Demo] Killing existing process on port $PORT (PID: $PID)"
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
}

# Reset on startup
reset_database

# Run server in a loop, restarting after each interval
while true; do
    echo "[Demo] Starting server (will restart in ${RESET_INTERVAL}s)"
    
    # Kill anything on the port first
    kill_port
    
    # Start server in background
    node dist/index.js &
    SERVER_PID=$!
    
    # Wait for the reset interval
    sleep $RESET_INTERVAL
    
    # Stop the server
    echo "[Demo] Stopping server for database reset..."
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
    # Make sure nothing is still on the port
    kill_port
    
    # Reset the database
    reset_database
done
