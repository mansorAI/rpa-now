# Arabic AI Automation - Quick Start Script
Write-Host "🚀 تشغيل منصة الأتمتة الذكية..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  تم إنشاء ملف .env - يرجى تعديله بمفاتيح API الخاصة بك" -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host "📦 تثبيت تبعيات Backend..." -ForegroundColor Blue
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "📦 تثبيت تبعيات Frontend..." -ForegroundColor Blue
Set-Location frontend
npm install
Set-Location ..

Write-Host ""
Write-Host "✅ جاهز! لتشغيل المشروع:" -ForegroundColor Green
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   أو باستخدام Docker: docker-compose up" -ForegroundColor White
Write-Host ""
Write-Host "📌 تأكد من:" -ForegroundColor Yellow
Write-Host "   1. تشغيل PostgreSQL وتعيين DATABASE_URL في backend/.env"
Write-Host "   2. تشغيل: cd backend && npm run migrate"
Write-Host "   3. إضافة OPENAI_API_KEY في backend/.env"
