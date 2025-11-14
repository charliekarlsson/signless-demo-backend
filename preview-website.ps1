# 🌐 Website Preview Script
# Quick way to view your website locally

Write-Host ""
Write-Host "🚀 SignLess Website Preview" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$websitePath = Join-Path $PSScriptRoot "website"

# Check if website folder exists
if (-not (Test-Path $websitePath)) {
    Write-Host "❌ Error: Website folder not found!" -ForegroundColor Red
    Write-Host "Looking for: $websitePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Website folder found!" -ForegroundColor Green
Write-Host ""

# Check for Python
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
}

if ($pythonCmd) {
    Write-Host "🐍 Starting local web server with Python..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Your website is running at:" -ForegroundColor Green
    Write-Host "   http://localhost:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌟 Open this URL in your browser to see the site!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Start server and open browser
    Start-Process "http://localhost:8000"
    
    Set-Location $websitePath
    & $pythonCmd -m http.server 8000
} else {
    # Fallback: Open index.html directly
    Write-Host "⚠️  Python not found. Opening file directly..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 For best results, install Python or use:" -ForegroundColor Cyan
    Write-Host "   - Option 1: Deploy to GitHub Pages (free)" -ForegroundColor White
    Write-Host "   - Option 2: Use VS Code Live Server extension" -ForegroundColor White
    Write-Host ""
    
    $indexPath = Join-Path $websitePath "index.html"
    Start-Process $indexPath
    
    Write-Host "✅ Opened index.html in your default browser" -ForegroundColor Green
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Customize the site (edit index.html)" -ForegroundColor White
Write-Host "   2. Deploy to GitHub Pages (see WEBSITE.md)" -ForegroundColor White
Write-Host "   3. Share with the world! 🎉" -ForegroundColor White
Write-Host ""
