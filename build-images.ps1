# ===========================================
# DarPay - Build Docker Images Locally (PowerShell)
# ===========================================

param(
    [string]$Tag = "latest",
    [string]$Registry = ""
)

Write-Host "🚀 Building DarPay Docker Images..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Tag: $Tag" -ForegroundColor Yellow

if ($Registry) {
    Write-Host "📦 Registry: $Registry" -ForegroundColor Yellow
}

# Generate Prisma client first
Write-Host ""
Write-Host "📝 Generating Prisma Client..." -ForegroundColor Green
pnpm db:generate

# Build Payout API
Write-Host ""
Write-Host "🔨 Building Payout API..." -ForegroundColor Green
docker build -t darpay-payout-api:$Tag `
    -f services/payout-api/Dockerfile `
    --build-arg DATABASE_URL=mysql://root:dummy@localhost:3306/dummy `
    .

# Build Payment API
Write-Host ""
Write-Host "🔨 Building Payment API..." -ForegroundColor Green
docker build -t darpay-payment-api:$Tag `
    -f services/payment-api/Dockerfile `
    --build-arg DATABASE_URL=mysql://root:dummy@localhost:3306/dummy `
    .

# Build Merchant Portal
Write-Host ""
Write-Host "🔨 Building Merchant Portal..." -ForegroundColor Green
docker build -t darpay-merchant-portal:$Tag `
    -f services/merchant-portal/Dockerfile `
    --build-arg NEXT_PUBLIC_API_URL=https://api-darpay.vstore.cloud `
    --build-arg NEXT_PUBLIC_PORTAL_URL=https://merchant-darpay.vstore.cloud `
    .

# Build Admin Portal
Write-Host ""
Write-Host "🔨 Building Admin Portal..." -ForegroundColor Green
docker build -t darpay-admin-portal:$Tag `
    -f services/admin-portal/Dockerfile `
    --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://api-darpay.vstore.cloud `
    --build-arg NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin-darpay.vstore.cloud `
    .

# Build Payment Page
Write-Host ""
Write-Host "🔨 Building Payment Page..." -ForegroundColor Green
docker build -t darpay-payment-page:$Tag `
    -f services/payment-page/Dockerfile `
    .

# Tag with registry if provided
if ($Registry) {
    Write-Host ""
    Write-Host "🏷️  Tagging images with registry..." -ForegroundColor Cyan
    docker tag darpay-payout-api:$Tag "$Registry/darpay-payout-api:$Tag"
    docker tag darpay-payment-api:$Tag "$Registry/darpay-payment-api:$Tag"
    docker tag darpay-merchant-portal:$Tag "$Registry/darpay-merchant-portal:$Tag"
    docker tag darpay-admin-portal:$Tag "$Registry/darpay-admin-portal:$Tag"
    docker tag darpay-payment-page:$Tag "$Registry/darpay-payment-page:$Tag"
}

Write-Host ""
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Images built:" -ForegroundColor Yellow
docker images | Select-String "darpay"

if ($Registry) {
    Write-Host ""
    Write-Host "🚢 To push to registry:" -ForegroundColor Cyan
    Write-Host "   docker push $Registry/darpay-payout-api:$Tag"
    Write-Host "   docker push $Registry/darpay-payment-api:$Tag"
    Write-Host "   docker push $Registry/darpay-merchant-portal:$Tag"
    Write-Host "   docker push $Registry/darpay-admin-portal:$Tag"
    Write-Host "   docker push $Registry/darpay-payment-page:$Tag"
}

Write-Host ""
Write-Host "💾 To save images for VPS transfer:" -ForegroundColor Cyan
Write-Host "   docker save darpay-payout-api:$Tag | gzip > darpay-payout-api.tar.gz"
Write-Host "   docker save darpay-payment-api:$Tag | gzip > darpay-payment-api.tar.gz"
Write-Host "   docker save darpay-merchant-portal:$Tag | gzip > darpay-merchant-portal.tar.gz"
Write-Host "   docker save darpay-admin-portal:$Tag | gzip > darpay-admin-portal.tar.gz"
Write-Host "   docker save darpay-payment-page:$Tag | gzip > darpay-payment-page.tar.gz"
