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
    # Get the project root directory (infopercept-inventory folder)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Relative paths from project root
    db_path = os.path.join(project_root, "src", "database", "app.db")
    backup_dir = os.path.join(project_root, "src", "database", "backups")
    
    backup_sqlite_db(db_path, backup_dir)
