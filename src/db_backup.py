import shutil
import datetime
import os
import sys

def backup_sqlite_db(db_path, backup_dir):
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"backup_{timestamp}.db")
    
    shutil.copy2(db_path, backup_file)
    print(f"Backup created at: {backup_file}")

if __name__ == "__main__":
    # Absolute path to your database
    db_path = "/home/bansarij/Bansi/inventory_management/inventory_management_system_tshirt_sizes/inventory_management_system/src/database/app.db"
    # Absolute path to your backup directory
    backup_dir = "/home/bansarij/Bansi/inventory_management/inventory_management_system_tshirt_sizes/inventory_management_system/src/database/backups"
    backup_sqlite_db(db_path, backup_dir)
