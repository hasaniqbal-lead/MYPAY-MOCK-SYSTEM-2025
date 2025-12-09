# Quick Deployment Script for Windows
# This script helps transfer files to VPS and provides deployment commands

$VPS_IP = "72.60.110.249"
$SSH_KEY = "c:\Users\hasan\.ssh\id_ed25519"
$LOCAL_PATH = "C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM"
$REMOTE_PATH = "/opt/payout-system"

Write-Host "`n=== PAYOUT SYSTEM VPS DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Transfer files
Write-Host "STEP 1: Transfer Files to VPS" -ForegroundColor Yellow
Write-Host "Choose your method:" -ForegroundColor White
Write-Host ""
Write-Host "Option A - SCP (Direct Transfer):" -ForegroundColor Green
Write-Host "Run this command to transfer files:" -ForegroundColor White
Write-Host "scp -i `"$SSH_KEY`" -r $LOCAL_PATH\* root@${VPS_IP}:$REMOTE_PATH/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option B - Git (Recommended):" -ForegroundColor Green
Write-Host "1. Push code to your Git repository" -ForegroundColor White
Write-Host "2. SSH to VPS and clone repository" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Press Enter to continue with SCP transfer, or type 'skip' to do it manually"

if ($choice -ne "skip") {
    Write-Host "`nCreating remote directory..." -ForegroundColor Yellow
    ssh -i $SSH_KEY root@$VPS_IP "mkdir -p $REMOTE_PATH"
    
    Write-Host "Transferring files (this may take a minute)..." -ForegroundColor Yellow
    scp -i $SSH_KEY -r "$LOCAL_PATH\*" "root@${VPS_IP}:$REMOTE_PATH/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Files transferred successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Transfer failed. Try manual method." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "STEP 2: Connect to VPS and Deploy" -ForegroundColor Yellow
Write-Host ""

$deploy = Read-Host "Connect to VPS now? (y/n)"

if ($deploy -eq "y") {
    Write-Host "`nConnecting to VPS..." -ForegroundColor Green
    Write-Host "Once connected, run these commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "cd /opt/payout-system" -ForegroundColor Cyan
    Write-Host "chmod +x deploy-to-vps.sh" -ForegroundColor Cyan
    Write-Host "./deploy-to-vps.sh" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Yellow
    Read-Host
    
    ssh -i $SSH_KEY root@$VPS_IP
} else {
    Write-Host ""
    Write-Host "Manual deployment commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connect to VPS:" -ForegroundColor White
    Write-Host "   ssh -i `"$SSH_KEY`" root@$VPS_IP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Run deployment:" -ForegroundColor White
    Write-Host "   cd /opt/payout-system" -ForegroundColor Cyan
    Write-Host "   chmod +x deploy-to-vps.sh" -ForegroundColor Cyan
    Write-Host "   ./deploy-to-vps.sh" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Setup SSL:" -ForegroundColor White
    Write-Host "   apt install certbot python3-certbot-nginx -y" -ForegroundColor Cyan
    Write-Host "   certbot --nginx -d sandbox.mycodigital.io" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Green
Write-Host ""

