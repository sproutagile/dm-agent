# Sprout AI Extension - Quick Setup Script

Write-Host "🌱 Sprout AI Extension Setup" -ForegroundColor Green
Write-Host "============================`n" -ForegroundColor Green

# Check if icon exists
$iconPath = "assets\icon.png"
if (Test-Path $iconPath) {
    Write-Host "✅ Icon found at $iconPath" -ForegroundColor Green
} else {
    Write-Host "❌ Icon NOT found at $iconPath" -ForegroundColor Red
    Write-Host "`nYou need to create a PNG icon. Options:" -ForegroundColor Yellow
    Write-Host "  1. Convert assets\icon.svg to PNG using:" -ForegroundColor Cyan
    Write-Host "     - Online: https://cloudconvert.com/svg-to-png" -ForegroundColor Cyan
    Write-Host "     - ImageMagick: magick convert assets\icon.svg -resize 512x512 assets\icon.png" -ForegroundColor Cyan
    Write-Host "  2. Use any 512x512 PNG icon and save as assets\icon.png`n" -ForegroundColor Cyan
    
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "`nExiting. Please add the icon and run this script again." -ForegroundColor Yellow
        exit
    }
}

Write-Host "`n📦 Starting development server..." -ForegroundColor Cyan
Write-Host "This will:" -ForegroundColor White
Write-Host "  • Generate icon assets" -ForegroundColor White
Write-Host "  • Build the extension" -ForegroundColor White
Write-Host "  • Watch for file changes`n" -ForegroundColor White

Write-Host "After the build completes:" -ForegroundColor Yellow
Write-Host "  1. Open Chrome and go to chrome://extensions/" -ForegroundColor White
Write-Host "  2. Enable 'Developer mode' (toggle in top right)" -ForegroundColor White
Write-Host "  3. Click 'Load unpacked'" -ForegroundColor White
Write-Host "  4. Select the 'build\chrome-mv3-dev' directory`n" -ForegroundColor White

Write-Host "Press Ctrl+C to stop the dev server when done.`n" -ForegroundColor Gray

# Start dev server
npm run dev
