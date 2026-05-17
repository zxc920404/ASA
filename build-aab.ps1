# Android AAB 自動打包腳本
# 用途：自動化建置 Android App Bundle (AAB) 檔案

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android AAB 自動打包腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步驟 1：檢查前置需求
Write-Host "[1/6] 檢查前置需求..." -ForegroundColor Yellow

# 檢查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 錯誤：找不到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js 版本：$nodeVersion" -ForegroundColor Green

# 檢查 Java
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 錯誤：找不到 Java，請先安裝 Java JDK 17" -ForegroundColor Red
    exit 1
}
$javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
Write-Host "✅ Java 版本：$javaVersion" -ForegroundColor Green

# 檢查 Android 資料夾
if (-not (Test-Path "android")) {
    Write-Host "❌ 錯誤：找不到 android 資料夾" -ForegroundColor Red
    Write-Host "請先執行：npx cap add android" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Android 專案已存在" -ForegroundColor Green

Write-Host ""

# 步驟 2：清理舊的建置檔案
Write-Host "[2/6] 清理舊的建置檔案..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ 已清理 dist 資料夾" -ForegroundColor Green
}
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "✅ 已清理 Android build 資料夾" -ForegroundColor Green
}
Write-Host ""

# 步驟 3：建置 Web 應用
Write-Host "[3/6] 建置 Web 應用..." -ForegroundColor Yellow
Write-Host "執行：npm run build" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 錯誤：Web 建置失敗" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Web 建置完成" -ForegroundColor Green
Write-Host ""

# 步驟 4：同步資源到 Android
Write-Host "[4/6] 同步資源到 Android..." -ForegroundColor Yellow
Write-Host "執行：npx cap sync android" -ForegroundColor Gray
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 錯誤：資源同步失敗" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 資源同步完成" -ForegroundColor Green
Write-Host ""

# 步驟 5：執行 Gradle 打包 AAB
Write-Host "[5/6] 執行 Gradle 打包 AAB..." -ForegroundColor Yellow
Write-Host "執行：gradlew bundleRelease" -ForegroundColor Gray
Set-Location android
.\gradlew.bat bundleRelease
$gradleExitCode = $LASTEXITCODE
Set-Location ..

if ($gradleExitCode -ne 0) {
    Write-Host "❌ 錯誤：Gradle 打包失敗" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 簽名金鑰配置錯誤（檢查 android/app/build.gradle）" -ForegroundColor Gray
    Write-Host "2. 缺少 release.keystore 檔案" -ForegroundColor Gray
    Write-Host "3. Gradle 快取損壞（執行：cd android && .\gradlew.bat clean）" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ AAB 打包完成" -ForegroundColor Green
Write-Host ""

# 步驟 6：顯示結果
Write-Host "[6/6] 打包完成！" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ AAB 檔案已成功生成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $aabSize = (Get-Item $aabPath).Length / 1MB
    Write-Host "📦 AAB 檔案位置：" -ForegroundColor Cyan
    Write-Host "   $aabPath" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 檔案大小：$([math]::Round($aabSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 下一步：" -ForegroundColor Cyan
    Write-Host "   1. 前往 Google Play Console" -ForegroundColor White
    Write-Host "   2. 創建新版本" -ForegroundColor White
    Write-Host "   3. 上傳 app-release.aab" -ForegroundColor White
    Write-Host "   4. 填寫版本說明並提交審核" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 詳細指南：BUILD_AAB_GUIDE.md" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  警告：找不到 AAB 檔案" -ForegroundColor Yellow
    Write-Host "預期位置：$aabPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
