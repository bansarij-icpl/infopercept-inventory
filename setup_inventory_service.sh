#!/bin/bash

# --- Dynamically set variables ---
SERVICE_NAME="infopercept-inventory"
USER_NAME=$(whoami)
PYTHON_PATH=$(which python3)

# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"  # One level up from /src
MAIN_PY="$SCRIPT_DIR/src/main.py"
BACKUP_PY="$SCRIPT_DIR/src/db_backup.py"
SERVICE_DIR="/etc/$SERVICE_NAME"

# 1. Create service directory
sudo mkdir -p "$SERVICE_DIR"

# 2. Create systemd service file dynamically
sudo tee "$SERVICE_DIR/$SERVICE_NAME.service" > /dev/null <<EOL
[Unit]
Description=Infopercept Inventory Management System
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$PROJECT_DIR
ExecStart=$PYTHON_PATH $MAIN_PY
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# 3. Symlink to systemd directory
sudo ln -sf "$SERVICE_DIR/$SERVICE_NAME.service" "/etc/systemd/system/$SERVICE_NAME.service"

# 4. Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# 5. Set up cron job for db_backup.py (runs every day at 4:00 PM)
CRON_JOB="0 16 * * * $PYTHON_PATH $BACKUP_PY >> $SCRIPT_DIR/src/database/backup.log 2>&1"
( crontab -l -u "$USER_NAME" 2>/dev/null | grep -v "$BACKUP_PY" ; echo "$CRON_JOB" ) | crontab -u "$USER_NAME" -

# 6. Final message
echo "✅ Setup complete!"
echo "Systemd service path: $SERVICE_DIR/$SERVICE_NAME.service"
echo "Systemd service enabled and running as: $SERVICE_NAME"
echo "🔁 Cron job set for: $BACKUP_PY (daily at 4:00 PM)"
