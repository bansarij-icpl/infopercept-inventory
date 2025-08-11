#!/bin/bash

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

# --- Step 1: Create virtual environment ---
echo "📦 Creating virtual environment..."
python3 -m venv "$PROJECT_DIR/venv"

echo "📦 Activating venv & installing dependencies..."
source "$PROJECT_DIR/venv/bin/activate"
pip install --upgrade pip
if [[ -f "$REQUIREMENTS_FILE" ]]; then
    pip install -r "$REQUIREMENTS_FILE"
else
    echo "⚠️ No requirements.txt found, installing flask manually."
    pip install flask
fi
deactivate

# --- Step 2: Create systemd service file ---
echo "⚙️ Creating systemd service file..."
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

# --- Step 3: Reload & enable service ---
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# --- Step 4: Setup cron job for backup ---
echo "🕒 Setting up daily backup cron job at 4:00 PM..."
CRON_JOB="0 16 * * * $PYTHON_BIN $BACKUP_PY >> $BACKUP_LOG 2>&1"
( crontab -l -u "$USER_NAME" 2>/dev/null | grep -v "$BACKUP_PY" ; echo "$CRON_JOB" ) | crontab -u "$USER_NAME" -

# --- Step 5: Final message ---
echo "✅ Setup complete!"
echo "Service file: $SERVICE_FILE"
echo "Service status: sudo systemctl status $SERVICE_NAME"
echo "Cron job set for: $BACKUP_PY (daily at 4:00 PM)"
