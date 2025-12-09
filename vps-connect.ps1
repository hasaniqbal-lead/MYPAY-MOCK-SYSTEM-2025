# VPS Connection Script for PowerShell
# This script helps connect to the VPS and execute commands

$VPS_IP = "72.60.110.249"
$VPS_USER = "root"
$VPS_PASSWORD = "-v9(Q158qCwKk4--5/WY"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  MyPay VPS Connection Helper" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS IP: $VPS_IP" -ForegroundColor Yellow
Write-Host "User: $VPS_USER" -ForegroundColor Yellow
Write-Host ""
Write-Host "To connect manually, use:" -ForegroundColor Green
Write-Host "  ssh $VPS_USER@$VPS_IP" -ForegroundColor White
Write-Host "  Password: $VPS_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "Using PuTTY? Download from: https://www.putty.org/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands to run on VPS to check current state:" -ForegroundColor Yellow
Write-Host "  1. docker ps -a                    # Check running containers" -ForegroundColor White
Write-Host "  2. docker images                   # Check Docker images" -ForegroundColor White
Write-Host "  3. netstat -tulpn | grep LISTEN    # Check listening ports" -ForegroundColor White
Write-Host "  4. systemctl status nginx          # Check Nginx status" -ForegroundColor White
Write-Host "  5. ls -la /opt/                    # Check deployed applications" -ForegroundColor White
Write-Host "  6. df -h                           # Check disk space" -ForegroundColor White
Write-Host "  7. free -m                         # Check memory" -ForegroundColor White
Write-Host ""

# Try to use ssh command if available
try {
    Write-Host "Attempting SSH connection..." -ForegroundColor Cyan
    Write-Host "You will need to enter the password when prompted" -ForegroundColor Yellow
    Write-Host ""
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VPS_USER@$VPS_IP"
} catch {
    Write-Host "SSH command not available in PowerShell path" -ForegroundColor Red
    Write-Host "Please use PuTTY or Windows Terminal with OpenSSH" -ForegroundColor Yellow
}
