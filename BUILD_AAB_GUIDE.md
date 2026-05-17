# 🚀 Android AAB 打包完整指南

## 📋 目錄
1. [前置需求](#前置需求)
2. [首次設定](#首次設定)
3. [打包 AAB 流程](#打包-aab-流程)
4. [簽名金鑰管理](#簽名金鑰管理)
5. [上傳到 Google Play](#上傳到-google-play)
6. [常見問題](#常見問題)

---

## 前置需求

### 必須安裝的軟體

| 軟體 | 版本要求 | 下載連結 |
|------|---------|---------|
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| Java JDK | 17 | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java17) |
| Android Studio | 最新版 | [developer.android.com](https://developer.android.com/studio) |

### 檢查安裝狀態

```bash
# 檢查 Node.js 版本
node --version
# 應該顯示 v18.x.x 或更高

# 檢查 Java 版本
java -version
# 應該顯示 java version "17.x.x"

# 檢查 Gradle（Android Studio 安裝後）
gradle --version
```

---

## 首次設定

### 步驟 1：安裝 Android SDK

1. 打開 **Android Studio**
2. 點擊 **More Actions** → **SDK Manager**
3. 確認已安裝：
   - ✅ Android SDK Platform 34
   - ✅ Android SDK Build-Tools 34.0.0
   - ✅ Android SDK Command-line Tools

### 步驟 2：設定環境變數（Windows）

```powershell
# 設定 ANDROID_HOME（替換成你的實際路徑）
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourName\AppData\Local\Android\Sdk", "User")

# 設定 JAVA_HOME（替換成你的實際路徑）
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")

# 重新啟動 PowerShell 以套用變更
```

### 步驟 3：初始化 Capacitor Android 平台

```bash
# 1. 確保依賴已安裝
npm install

# 2. 構建 Web 應用
npm run build

# 3. 新增 Android 平台（如果還沒有 android 資料夾）
npx cap add android

# 4. 同步 Web 資源到 Android
npx cap sync android
```

---

## 打包 AAB 流程

### 🎯 方法 1：一鍵打包腳本（推薦）

我們為你建立了自動化腳本，執行以下命令：

```bash
# Windows PowerShell
.\build-aab.ps1

# 或使用 npm script
npm run build:aab
```

這個腳本會自動：
1. ✅ 清理舊的建置檔案
2. ✅ 執行 TypeScript 編譯
3. ✅ 執行 Vite 建置
4. ✅ 同步資源到 Android
5. ✅ 執行 Gradle 打包 AAB
6. ✅ 顯示 AAB 檔案位置

### 🛠️ 方法 2：手動打包

```bash
# 步驟 1：清理並建置 Web 應用
npm run build

# 步驟 2：同步到 Android
npx cap sync android

# 步驟 3：進入 Android 目錄
cd android

# 步驟 4：執行 Gradle 打包（Windows）
.\gradlew.bat bundleRelease

# 步驟 5：找到生成的 AAB 檔案
# 位置：android\app\build\outputs\bundle\release\app-release.aab
```

### 📦 方法 3：使用 Android Studio（圖形介面）

1. 打開 Android Studio
2. 點擊 **Build** → **Generate Signed Bundle / APK**
3. 選擇 **Android App Bundle**
4. 選擇或創建 Keystore（見下方簽名金鑰管理）
5. 選擇 **release** 建置類型
6. 點擊 **Finish**

生成的 AAB 位於：
```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## 簽名金鑰管理

### 🔑 創建簽名金鑰（首次打包必須）

```bash
# 在專案根目錄執行
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**互動式問答：**
```
Enter keystore password: [輸入密碼，至少 6 個字元]
Re-enter new password: [再次輸入密碼]
What is your first and last name? [你的名字]
What is the name of your organizational unit? [組織單位，可留空]
What is the name of your organization? [組織名稱，可留空]
What is the name of your City or Locality? [城市]
What is the name of your State or Province? [省份]
What is the two-letter country code for this unit? [國家代碼，例如 TW]
Is CN=..., correct? [yes]
```

**⚠️ 重要提醒：**
- 📝 記錄密碼到安全的地方（密碼管理器）
- 💾 備份 `release.keystore` 檔案到雲端或外部硬碟
- 🚫 **絕對不要**將 keystore 檔案提交到 Git
- ❌ 遺失金鑰將**永遠無法更新**應用程式

### 🔐 配置 Gradle 使用簽名金鑰

#### 方法 A：使用環境變數（推薦，更安全）

1. 建立 `android/keystore.properties` 檔案：

```properties
storePassword=你的keystore密碼
keyPassword=你的key密碼
keyAlias=release
storeFile=../../release.keystore
```

2. 將 `keystore.properties` 加入 `.gitignore`：

```bash
echo "android/keystore.properties" >> .gitignore
echo "release.keystore" >> .gitignore
```

3. 編輯 `android/app/build.gradle`：

```gradle
// 在 android 區塊之前添加
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 方法 B：直接寫在 build.gradle（不推薦）

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../release.keystore")
            storePassword "你的密碼"
            keyAlias "release"
            keyPassword "你的密碼"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 上傳到 Google Play

### 📱 步驟 1：準備應用程式資訊

在上傳 AAB 之前，確保已準備：

#### 必要資料
- ✅ 應用程式名稱（顯示在 Play Store）
- ✅ 簡短描述（80 字元以內）
- ✅ 完整描述（4000 字元以內）
- ✅ 應用程式圖示（512x512 PNG，32-bit，透明背景）
- ✅ 功能圖片（1024x500 JPG/PNG）
- ✅ 螢幕截圖（至少 2 張，手機：1080x1920 或 1920x1080）
- ✅ 隱私權政策連結（必須是 HTTPS）

#### 範例描述

**簡短描述：**
```
在無盡的敵人浪潮中存活，升級武器，成為最強的倖存者！
```

**完整描述：**
```
🎮 小俠想要活下去 - Roguelike 生存遊戲

在這款刺激的生存遊戲中，你將面對無盡的敵人浪潮！

✨ 遊戲特色：
• 自動攻擊系統 - 專注於走位與策略
• 多種武器與技能 - 超過 10 種武器可升級
• Roguelike 元素 - 每次遊戲都有不同體驗
• 永久升級系統 - 持續變強
• 簡單易上手 - 單手即可操作

🎯 遊戲目標：
在 30 分鐘內存活，擊敗最終 Boss！

📱 完美適配手機：
• 優化的觸控操作
• 流暢的 60 FPS 體驗
• 支援橫向螢幕

立即下載，挑戰你的生存極限！
```

### 📤 步驟 2：上傳 AAB 到 Google Play Console

1. **登入 Google Play Console**
   - 前往 [play.google.com/console](https://play.google.com/console)
   - 如果沒有開發者帳號，需要支付 $25 USD 註冊費

2. **創建應用程式**
   - 點擊「創建應用程式」
   - 選擇語言：繁體中文
   - 應用程式名稱：小俠想要活下去
   - 選擇「遊戲」類別
   - 選擇「免費」或「付費」

3. **設定商店資訊**
   - 左側選單：**商店資訊** → **主要商店資訊**
   - 上傳應用程式圖示、螢幕截圖、功能圖片
   - 填寫應用程式說明

4. **上傳 AAB**
   - 左側選單：**發布** → **正式版**
   - 點擊「創建新版本」
   - 上傳 `app-release.aab`
   - 填寫「版本說明」（告訴用戶這個版本的新功能）

5. **完成內容分級**
   - 左側選單：**政策** → **應用程式內容**
   - 完成內容分級問卷
   - 遊戲類別選擇：動作/街機

6. **設定目標對象**
   - 選擇目標年齡層（建議：13 歲以上）
   - 確認是否包含廣告

7. **隱私權政策**
   - 提供隱私權政策連結（必須是 HTTPS）
   - 如果沒有網站，可以使用 GitHub Pages 或 Google Sites

8. **提交審核**
   - 確認所有必填項目都已完成
   - 點擊「提交審核」
   - 等待 Google 審核（通常 1-7 天）

### 📊 審核狀態

| 狀態 | 說明 | 預計時間 |
|------|------|---------|
| 審核中 | Google 正在審核你的應用程式 | 1-7 天 |
| 已核准 | 應用程式已上架 | - |
| 遭拒 | 需要修正問題後重新提交 | - |

---

## 常見問題

### ❓ Q1：找不到 Android SDK

**錯誤訊息：**
```
ANDROID_HOME is not set
```

**解決方案：**
1. 確認 Android Studio 已安裝
2. 設定環境變數 `ANDROID_HOME`（見上方「首次設定」）
3. 重新啟動終端機

---

### ❓ Q2：Gradle 建置失敗

**錯誤訊息：**
```
Execution failed for task ':app:bundleRelease'
```

**解決方案：**
```bash
# 清理建置快取
cd android
.\gradlew.bat clean

# 重新建置
.\gradlew.bat bundleRelease
```

---

### ❓ Q3：簽名金鑰錯誤

**錯誤訊息：**
```
Keystore file not found
```

**解決方案：**
1. 確認 `release.keystore` 檔案在專案根目錄
2. 檢查 `android/app/build.gradle` 中的路徑是否正確
3. 確認 `keystore.properties` 檔案存在且內容正確

---

### ❓ Q4：AAB 檔案太大

**問題：**
AAB 檔案超過 150 MB

**解決方案：**
1. 檢查是否包含不必要的資源檔案
2. 壓縮圖片資源（使用 TinyPNG）
3. 移除未使用的音效檔案
4. 啟用 Proguard 程式碼混淆（進階）

---

### ❓ Q5：遊戲在手機上無法啟動

**解決方案：**
1. 檢查 `capacitor.config.ts` 中的 `minSdkVersion`（建議 24）
2. 確認 WebView 正確配置
3. 使用 Android Studio 的 Logcat 查看錯誤訊息

---

### ❓ Q6：觸控搖桿不顯示

**解決方案：**
1. 確認 `InputController.ts` 正確偵測觸控裝置
2. 檢查 `TouchInputAdapter.ts` 是否正確初始化
3. 在 Chrome DevTools 的 Device Mode 測試

---

## 🎯 快速檢查清單

### 打包前檢查
- [ ] 遊戲可以正常啟動
- [ ] 觸控搖桿可以正常使用
- [ ] 所有核心功能正常運作
- [ ] UI 顯示正常
- [ ] 沒有明顯的 Bug

### 上架前檢查
- [ ] 已創建簽名金鑰並備份
- [ ] AAB 檔案已成功生成
- [ ] 應用程式圖示已準備（512x512）
- [ ] 螢幕截圖已準備（至少 2 張）
- [ ] 應用程式說明已撰寫
- [ ] 隱私權政策連結已準備
- [ ] 已完成內容分級問卷

---

## 📞 需要幫助？

如果遇到問題，可以：
1. 查看 [Capacitor 官方文件](https://capacitorjs.com/docs/android)
2. 查看 [Google Play Console 說明](https://support.google.com/googleplay/android-developer)
3. 檢查 Android Studio 的 Logcat 錯誤訊息

---

## 🎉 恭喜！

完成以上步驟後，你的遊戲就可以在 Google Play 上架了！

**下一步：**
- 📊 監控下載量與評價
- 🐛 收集用戶反饋並修復 Bug
- ✨ 規劃新功能與更新
- 💰 考慮加入廣告或內購（選配）

**祝你上架順利！🚀**
