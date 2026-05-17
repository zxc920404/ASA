# 🚀 AAB 打包快速開始

## 📋 5 分鐘快速上手

### 前置需求檢查

```bash
# 檢查 Node.js（需要 >= 18）
node --version

# 檢查 Java（需要 17）
java -version

# 檢查 Android SDK（需要設定 ANDROID_HOME）
echo $env:ANDROID_HOME
```

---

## 🎯 首次打包（完整流程）

### 步驟 1：初始化 Android 平台

```bash
# 安裝依賴
npm install

# 建置 Web 應用
npm run build

# 新增 Android 平台（首次執行）
npx cap add android

# 同步資源
npx cap sync android
```

### 步驟 2：創建簽名金鑰

```bash
# 在專案根目錄執行
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ 重要：記錄密碼並備份 release.keystore 檔案！**

### 步驟 3：配置簽名

建立 `android/keystore.properties`：

```properties
storePassword=你的keystore密碼
keyPassword=你的key密碼
keyAlias=release
storeFile=../../release.keystore
```

### 步驟 4：打包 AAB

```bash
# 使用自動化腳本（推薦）
npm run build:aab

# 或手動執行
cd android
.\gradlew.bat bundleRelease
```

### 步驟 5：找到 AAB 檔案

```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## 🔄 後續更新打包（簡化流程）

已經完成首次設定後，每次更新只需要：

```bash
# 一鍵打包
npm run build:aab
```

就這麼簡單！✨

---

## 📱 上傳到 Google Play

1. 前往 [Google Play Console](https://play.google.com/console)
2. 選擇你的應用程式
3. 點擊「發布」→「正式版」→「創建新版本」
4. 上傳 `app-release.aab`
5. 填寫版本說明
6. 提交審核

---

## 🛠️ 常用命令

```bash
# 建置 Web 應用
npm run build

# 同步資源到 Android
npm run cap:sync

# 在 Android Studio 中打開專案
npm run cap:open

# 一鍵打包 AAB
npm run build:aab

# 清理建置快取
cd android && .\gradlew.bat clean
```

---

## ❓ 遇到問題？

### 問題 1：找不到 ANDROID_HOME

```powershell
# 設定環境變數（替換成你的路徑）
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourName\AppData\Local\Android\Sdk", "User")
```

### 問題 2：Gradle 建置失敗

```bash
cd android
.\gradlew.bat clean
.\gradlew.bat bundleRelease
```

### 問題 3：簽名金鑰錯誤

確認：
1. `release.keystore` 在專案根目錄
2. `android/keystore.properties` 存在且內容正確
3. 密碼正確

---

## 📚 詳細文件

- 📖 完整指南：`BUILD_AAB_GUIDE.md`
- 🔐 隱私權政策範本：`PRIVACY_POLICY.md`
- ⚙️ Capacitor 設定：`CAPACITOR_SETUP.md`

---

## ✅ 檢查清單

### 打包前
- [ ] 遊戲功能正常
- [ ] 觸控搖桿可用
- [ ] UI 顯示正常
- [ ] 沒有明顯 Bug

### 上架前
- [ ] AAB 檔案已生成
- [ ] 應用程式圖示（512x512）
- [ ] 螢幕截圖（至少 2 張）
- [ ] 應用程式說明
- [ ] 隱私權政策連結

---

**🎉 準備好了嗎？執行 `npm run build:aab` 開始打包！**
