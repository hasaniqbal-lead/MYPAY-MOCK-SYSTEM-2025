# ===========================================
# MyPay Deployment Preparation Script
# ===========================================

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "  MyPay Deployment Preparation"  -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Configuration
$VPS_IP = "72.60.110.249"
$VPS_USER = "root"
$VPS_DIR = "/opt/mypay-mock"

Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check if tar is available (for creating archive)
$hasTar = Get-Command tar -ErrorAction SilentlyContinue
if ($hasTar) {
    Write-Host "  [OK] tar is available" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] tar not found. Will create ZIP instead" -ForegroundColor Yellow
}

# Check if ssh is available
$hasSsh = Get-Command ssh -ErrorAction SilentlyContinue
if ($hasSsh) {
    Write-Host "  [OK] SSH is available" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] SSH not found. Manual transfer required" -ForegroundColor Yellow
}

# Check if scp is available
$hasScp = Get-Command scp -ErrorAction SilentlyContinue
if ($hasScp) {
    Write-Host "  [OK] SCP is available" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] SCP not found. Manual transfer required" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/5] Preparing deployment files..." -ForegroundColor Yellow
Write-Host ""

# Create deployment directory
$deployDir = ".\deployment-package"
if (Test-Path $deployDir) {
    Write-Host "  Removing old deployment package..." -ForegroundColor Gray
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy essential files
Write-Host "  Copying files..." -ForegroundColor Gray

$filesToCopy = @(
    "docker-compose.yml",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    ".env.production",
    "deploy-production.sh",
    "test-deployment.sh",
    "vps-audit.sh",
    "vps-cleanup.sh"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item $file $deployDir -Force
        Write-Host "    [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "    [SKIP] $file (not found)" -ForegroundColor Yellow
    }
}

# Copy directories
$directoriesToCopy = @(
    "services",
    "nginx",
    "prisma",
    "packages"
)

foreach ($dir in $directoriesToCopy) {
    if (Test-Path $dir) {
        Copy-Item $dir $deployDir -Recurse -Force
        Write-Host "    [OK] $dir/" -ForegroundColor Green
    } else {
        Write-Host "    [SKIP] $dir/ (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[3/5] Creating deployment archive..." -ForegroundColor Yellow
Write-Host ""

$archiveName = "mypay-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if ($hasTar) {
    # Create tar.gz archive
    $archiveFile = "$archiveName.tar.gz"
    tar -czf $archiveFile -C $deployDir .
    Write-Host "  [OK] Created $archiveFile" -ForegroundColor Green
} else {
    # Create ZIP archive
    $archiveFile = "$archiveName.zip"
    Compress-Archive -Path "$deployDir\*" -DestinationPath $archiveFile -Force
    Write-Host "  [OK] Created $archiveFile" -ForegroundColor Green
}

$archiveSize = (Get-Item $archiveFile).Length / 1MB
Write-Host "  Archive size: $($archiveSize.ToString('0.00')) MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "[4/5] Generating transfer commands..." -ForegroundColor Yellow
Write-Host ""

# Create transfer script
$transferScript = @"
# ===========================================
# Transfer Script - Run these commands
# ===========================================

# Option 1: Using SCP (Recommended if available)
scp $archiveFile ${VPS_USER}@${VPS_IP}:/opt/

# Then SSH and extract:
ssh ${VPS_USER}@${VPS_IP}

# Once connected to VPS:
cd /opt
mkdir -p $VPS_DIR
tar -xzf /opt/$archiveFile -C $VPS_DIR/
cd $VPS_DIR
chmod +x *.sh

# Option 2: Manual transfer using WinSCP or FileZilla
# 1. Connect to: ${VPS_IP}
# 2. User: ${VPS_USER}
# 3. Upload $archiveFile to /opt/
# 4. Extract on VPS
"@

$transferScript | Out-File "transfer-instructions.txt" -Encoding UTF8
Write-Host "  [OK] Created transfer-instructions.txt" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Creating production environment template..." -ForegroundColor Yellow
Write-Host ""

# Generate strong secrets
$dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
$apiKeySecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
$webhookSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})

$envContent = @"
# ===========================================
# MyPay Mock Platform - Production Environment
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# ===========================================

# Database Configuration
DB_PASSWORD=$dbPassword
DB_NAME=mypay_mock_db

# JWT Secret
JWT_SECRET=$jwtSecret

# API Key Secret
API_KEY_SECRET=$apiKeySecret

# Webhook Secret
WEBHOOK_SECRET=$webhookSecret

# Domain Configuration
SANDBOX_DOMAIN=sandbox.mycodigital.io
PORTAL_DOMAIN=devportal.mycodigital.io
ADMIN_DOMAIN=devadmin.mycodigital.io
"@

$envContent | Out-File ".env.production.generated" -Encoding UTF8
Write-Host "  [OK] Generated .env.production.generated with secure secrets" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PREPARATION COMPLETE!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  1. $archiveFile - Deployment archive" -ForegroundColor White
Write-Host "  2. transfer-instructions.txt - Transfer commands" -ForegroundColor White
Write-Host "  3. .env.production.generated - Production secrets" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Transfer files to VPS" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray

if ($hasScp) {
    Write-Host ""
    Write-Host "  Run this command to transfer:" -ForegroundColor White
    Write-Host "  scp $archiveFile ${VPS_USER}@${VPS_IP}:/opt/" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Use WinSCP or FileZilla:" -ForegroundColor White
    Write-Host "    Host: $VPS_IP" -ForegroundColor Gray
    Write-Host "    User: $VPS_USER" -ForegroundColor Gray
    Write-Host "    Upload: $archiveFile to /opt/" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Step 2: Connect to VPS" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray
Write-Host ""
Write-Host "  ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Green
Write-Host "  Password: -v9(Q158qCwKk4--5/WY" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Extract and Setup on VPS" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray
Write-Host ""
Write-Host "  cd /opt" -ForegroundColor Green
Write-Host "  mkdir -p $VPS_DIR" -ForegroundColor Green
Write-Host "  tar -xzf /opt/$archiveFile -C $VPS_DIR/" -ForegroundColor Green
Write-Host "  cd $VPS_DIR" -ForegroundColor Green
Write-Host "  chmod +x *.sh" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Configure Environment" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray
Write-Host ""
Write-Host "  Copy the generated secrets from .env.production.generated" -ForegroundColor White
Write-Host "  to the VPS .env file:" -ForegroundColor White
Write-Host ""
Write-Host "  nano .env" -ForegroundColor Green
Write-Host "  (Paste the secrets, save with Ctrl+X, Y, Enter)" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 5: Deploy!" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray
Write-Host ""
Write-Host "  sudo ./deploy-production.sh" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Test Deployment" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Gray
Write-Host ""
Write-Host "  ./test-deployment.sh" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "  DEPLOYMENT-GUIDE.md" -ForegroundColor White
Write-Host ""

# Offer to open files
Write-Host "Would you like to:" -ForegroundColor Yellow
Write-Host "  [1] Open DEPLOYMENT-GUIDE.md" -ForegroundColor White
Write-Host "  [2] Open transfer-instructions.txt" -ForegroundColor White
Write-Host "  [3] Open .env.production.generated" -ForegroundColor White
Write-Host "  [4] Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" { Start-Process "DEPLOYMENT-GUIDE.md" }
    "2" { Start-Process "transfer-instructions.txt" }
    "3" { Start-Process ".env.production.generated" }
    "4" { exit }
    default { Write-Host "Invalid choice. Exiting." -ForegroundColor Red }
}
