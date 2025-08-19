#!/bin/bash

set -e  # Exit if any command fails

# --- Variables ---
SERVICE_NAME="infopercept-inventory"
USER_NAME=$(whoami)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"  # Script's folder
PYTHON_BIN="$PROJECT_DIR/venv/bin/python"
MAIN_PY="$PROJECT_DIR/src/main.py"
BACKUP_PY="$PROJECT_DIR/src/db_backup.py"
REQUIREMENTS_FILE="$PROJECT_DIR/requirements.txt"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
BACKUP_LOG="$PROJECT_DIR/src/database/backup.log"

# --- Step 1: Ensure venv is installed ---
echo "📦 Checking python3-venv package..."
if ! dpkg -s python3-venv >/dev/null 2>&1; then
    echo "⚠️ python3-venv not found, installing..."
    sudo apt update && sudo apt install -y python3-venv
fi

# --- Step 2: Create or reuse virtual environment ---
echo "📦 Setting up virtual environment..."
if [[ ! -d "$PROJECT_DIR/venv" ]]; then
    python3 -m venv "$PROJECT_DIR/venv"
fi

echo "📦 Activating venv & installing dependencies..."
source "$PROJECT_DIR/venv/bin/activate"
pip install --upgrade pip wheel setuptools

if [[ -f "$REQUIREMENTS_FILE" ]]; then
    pip install -r "$REQUIREMENTS_FILE"
fi

# Always ensure critical deps are present
pip install flask weasyprint

deactivate

# --- Step 3: Create/Update systemd service file ---
echo "⚙️ Creating/Updating systemd service file..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOL
[Unit]
Description=Infopercept Inventory Management System
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$PROJECT_DIR
ExecStart=$PYTHON_BIN $MAIN_PY
Restart=always
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOL

# --- Step 4: Reload & restart service ---
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# --- Step 5: Setup cron job for backup ---
echo "🕒 Setting up daily backup cron job at 4:00 PM..."
CRON_JOB="0 16 * * * $PYTHON_BIN $BACKUP_PY >> $BACKUP_LOG 2>&1"
( crontab -l -u "$USER_NAME" 2>/dev/null | grep -v "$BACKUP_PY" ; echo "$CRON_JOB" ) | crontab -u "$USER_NAME" -

# --- Step 6: Final message ---
echo "✅ Setup complete!"
echo "Service file: $SERVICE_FILE"
echo "Service status: sudo systemctl status $SERVICE_NAME"
echo "Cron job set for: $BACKUP_PY (daily at 4:00 PM)"
