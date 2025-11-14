# Quick Start Script for Windows PowerShell

Write-Host "🚀 Solana Transaction Auth - Quick Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Backend Setup
Write-Host "`n📦 Setting up Backend..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    npm install
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "`n⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env and add your RECEIVER_WALLET_ADDRESS" -ForegroundColor Yellow
}

# Frontend Setup
Write-Host "`n📦 Setting up Frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Set-Location frontend
    if (Test-Path "package.json") {
        npm install
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
        
        # Create frontend .env
        if (-not (Test-Path ".env")) {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Frontend .env file created" -ForegroundColor Green
        }
    }
    Set-Location ..
} else {
    Write-Host "⚠️  Frontend directory not found" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and add your Solana wallet address" -ForegroundColor White
Write-Host "2. Run 'npm start' to start the backend server" -ForegroundColor White
Write-Host "3. In another terminal, run 'cd frontend; npm run dev' to start the frontend" -ForegroundColor White
Write-Host "4. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "`n📚 Documentation: Check README.md for detailed instructions`n" -ForegroundColor Cyan
