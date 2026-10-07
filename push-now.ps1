# Quick Push to GitHub Script
# Run this AFTER creating your repository on GitHub

param(
    [Parameter(Mandatory=$false)]
    [string]$Username = ""
)

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  iSIN - Push to GitHub" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "`n❌ Error: Not a git repository" -ForegroundColor Red
    Write-Host "Run this from the d:\iSIN directory" -ForegroundColor Yellow
    exit 1
}

# Get username if not provided
if ([string]::IsNullOrEmpty($Username)) {
    Write-Host "`nEnter your GitHub username:" -ForegroundColor Yellow
    $Username = Read-Host
}

if ([string]::IsNullOrEmpty($Username)) {
    Write-Host "`n❌ Error: Username cannot be empty" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$Username/isin.git"

Write-Host "`n📦 Repository URL: $repoUrl" -ForegroundColor Cyan

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "`n⚠️  Remote 'origin' already exists: $remoteExists" -ForegroundColor Yellow
    Write-Host "Do you want to replace it? (y/n):" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "`nRemoving old remote..." -ForegroundColor Cyan
        git remote remove origin
    } else {
        Write-Host "`nKeeping existing remote." -ForegroundColor Green
        exit 0
    }
}

# Add remote
Write-Host "`n➕ Adding remote 'origin'..." -ForegroundColor Cyan
git remote add origin $repoUrl

# Rename branch to main
Write-Host "`n🔄 Renaming branch to 'main'..." -ForegroundColor Cyan
git branch -M main

# Show what will be pushed
Write-Host "`n📊 Files to push:" -ForegroundColor Cyan
git log --oneline -1
$fileCount = (git ls-files | Measure-Object).Count
Write-Host "   $fileCount files ready" -ForegroundColor Green

Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "   (You may be asked for GitHub credentials)" -ForegroundColor Gray

# Push to GitHub
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "  Next Steps:" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "`n1. View your repository:" -ForegroundColor White
    Write-Host "   https://github.com/$Username/isin" -ForegroundColor Cyan
    Write-Host "`n2. Deploy to Railway:" -ForegroundColor White
    Write-Host "   Open: RAILWAY_QUICK_START.md" -ForegroundColor Cyan
    Write-Host "`n3. Setup Database:" -ForegroundColor White
    Write-Host "   Run: supabase/complete-isin-setup.sql" -ForegroundColor Cyan
    Write-Host "`n==================================" -ForegroundColor Cyan
    
    # Offer to open repository in browser
    Write-Host "`nOpen repository in browser? (y/n):" -ForegroundColor Yellow
    $openBrowser = Read-Host
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
        Start-Process "https://github.com/$Username/isin"
    }
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    Write-Host "`nCommon solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure you created the repository on GitHub" -ForegroundColor White
    Write-Host "2. Check your GitHub username is correct: $Username" -ForegroundColor White
    Write-Host "3. Use a Personal Access Token instead of password" -ForegroundColor White
    Write-Host "   Create one at: https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "`nFor detailed help, see: PUSH_TO_GITHUB.md" -ForegroundColor Cyan
}
