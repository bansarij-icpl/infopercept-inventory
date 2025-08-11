# ============================
# Infopercept Inventory Setup (Windows)
# ============================

# --- Variables ---
$ServiceName = "InfoperceptInventory"
$ProjectDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$VenvPath    = Join-Path $ProjectDir "venv"
$PythonExe   = Join-Path $VenvPath "Scripts\python.exe"
$MainPy      = Join-Path $ProjectDir "src\main.py"
$BackupPy    = Join-Path $ProjectDir "src\db_backup.py"
$BackupLog   = Join-Path $ProjectDir "src\database\backup.log"
$RequirementsFile = Join-Path $ProjectDir "requirements.txt"
$NssmExe     = "C:\nssm\nssm.exe"   # Path to NSSM executable

# --- Step 1: Create virtual environment ---
Write-Host "📦 Creating Python virtual environment..."
python -m venv $VenvPath

Write-Host "📦 Installing dependencies..."
& $PythonExe -m pip install --upgrade pip
if (Test-Path $RequirementsFile) {
    & $PythonExe -m pip install -r $RequirementsFile
} else {
    Write-Host "⚠️ No requirements.txt found, installing flask manually."
    & $PythonExe -m pip install flask
}

# --- Step 2: Install NSSM if not found ---
if (-Not (Test-Path $NssmExe)) {
    Write-Host "⬇️ Downloading NSSM..."
    $NssmZip = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $NssmZip
    Expand-Archive $NssmZip -DestinationPath "C:\nssm" -Force
    $NssmExe = Get-ChildItem "C:\nssm" -Recurse -Filter "nssm.exe" | Select-Object -First 1 -ExpandProperty FullName
}

# --- Step 3: Create Windows service with NSSM ---
Write-Host "⚙️ Creating Windows service..."
& $NssmExe install $ServiceName $PythonExe $MainPy
& $NssmExe set $ServiceName AppDirectory $ProjectDir
& $NssmExe set $ServiceName Start SERVICE_AUTO_START
& $NssmExe start $ServiceName

# --- Step 4: Create Scheduled Task for daily backup ---
Write-Host "🕒 Creating scheduled task for backup..."
$Action   = New-ScheduledTaskAction -Execute $PythonExe -Argument "`"$BackupPy`""
$Trigger  = New-ScheduledTaskTrigger -Daily -At 4:00PM
$TaskName = "InfoperceptInventoryBackup"

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Description "Daily backup for Infopercept Inventory" -User $env:USERNAME -RunLevel Highest -Force

# --- Step 5: Final message ---
Write-Host "✅ Setup complete!"
Write-Host "Service name: $ServiceName (manage with 'nssm stop $ServiceName', 'nssm start $ServiceName')"
Write-Host "Backup scheduled task: $TaskName"
