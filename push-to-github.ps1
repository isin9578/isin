# iSIN - Push to GitHub Script
# This script helps you push your code to GitHub

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  iSIN - Push to GitHub Helper" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nGit Status:" -ForegroundColor Yellow
git status

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`n1. Create a new repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Cyan

Write-Host "`n2. Choose a repository name (e.g., 'isin')" -ForegroundColor White

Write-Host "`n3. DO NOT initialize with README" -ForegroundColor Yellow

Write-Host "`n4. After creating, run these commands:" -ForegroundColor White
Write-Host "   " -NoNewline
Write-Host "cd d:\iSIN" -ForegroundColor Cyan
Write-Host "   " -NoNewline
Write-Host "git branch -M main" -ForegroundColor Cyan
Write-Host "   " -NoNewline
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/isin.git" -ForegroundColor Cyan
Write-Host "   " -NoNewline
Write-Host "git push -u origin main" -ForegroundColor Cyan

Write-Host "`n5. Replace YOUR_USERNAME with your GitHub username" -ForegroundColor Yellow

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Repository Details:" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Files committed: 86" -ForegroundColor White
Write-Host "Latest commit:" -ForegroundColor White
git log -1 --oneline

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "For detailed instructions, see:" -ForegroundColor Green
Write-Host "PUSH_TO_GITHUB.md" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nPress any key to open GitHub in browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://github.com/new"
