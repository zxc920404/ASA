# Capacitor Android 打包指南

## 📱 MVP 上架版本 - Android AAB 打包流程

### 前置需求

1. **Node.js** - 已安裝 ✅
2. **Android Studio** - 需要安裝
3. **Java JDK 17** - 需要安裝

---

## 🚀 快速開始

### 步驟 1：初始化 Android 平台

```bash
# 1. 構建 Web 應用
npm run build

# 2. 新增 Android 平台
npx cap add android

# 3. 同步 Web 資源到 Android
npx cap sync android
```

### 步驟 2：在 Android Studio 中打開專案

```bash
npx cap open android
```

這會自動打開 Android Studio。

---

## 📦 打包 AAB（Google Play 上架格式）

### 方法 1：使用 Android Studio（推薦）

1. 在 Android Studio 中，點擊 **Build** → **Generate Signed Bundle / APK**
2. 選擇 **Android App Bundle**
3. 創建或選擇簽名金鑰（Keystore）
4. 選擇 **release** 建置類型
5. 點擊 **Finish**

生成的 AAB 檔案位於：
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 方法 2：使用命令列

```bash
cd android
./gradlew bundleRelease
```

---

## 🔑 創建簽名金鑰（首次打包必須）

### 使用 keytool 創建 Keystore

```bash
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**重要提示：**
- 妥善保管 `release.keystore` 檔案和密碼
- 遺失金鑰將無法更新應用程式
- 建議備份到安全的地方

### 配置 Gradle 使用 Keystore

編輯 `android/app/build.gradle`，在 `android` 區塊中添加：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../release.keystore")
            storePassword "your_keystore_password"
            keyAlias "release"
            keyPassword "your_key_password"
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

---

## 🎮 測試遊戲

### 在模擬器或實機上測試

```bash
# 構建並運行
npm run build
npx cap sync android
npx cap run android
```

### 檢查觸控搖桿

1. 在實機或模擬器上啟動遊戲
2. 觸碰螢幕左半部應該顯示虛擬搖桿
3. 拖動搖桿應該可以移動角色

---

## 📋 上架前檢查清單

### 必須完成項目

- [ ] 遊戲可以正常啟動
- [ ] 觸控搖桿可以正常使用
- [ ] 敵人會從四周大量生成
- [ ] 三種武器都在自動攻擊
- [ ] 經驗球會掉落並可以收集
- [ ] 升級系統正常運作
- [ ] 玩家死亡後顯示結算畫面
- [ ] UI 顯示正常（HP、EXP、時間、擊殺數）
- [ ] 畫面有基本視覺效果（不像 Debug 方塊）

### 應用程式資訊

- [ ] 修改 `capacitor.config.ts` 中的 `appId`（例如：`com.yourcompany.gamename`）
- [ ] 修改 `appName`（顯示在手機上的名稱）
- [ ] 準備應用程式圖示（512x512 PNG）
- [ ] 準備啟動畫面圖片

---

## 🐛 常見問題

### 問題 1：找不到 Android SDK

**解決方案：**
1. 安裝 Android Studio
2. 打開 Android Studio → SDK Manager
3. 安裝 Android SDK Platform 34
4. 設定環境變數 `ANDROID_HOME`

### 問題 2：Gradle 建置失敗

**解決方案：**
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### 問題 3：觸控搖桿不顯示

**解決方案：**
- 確認 `InputController.ts` 正確偵測觸控裝置
- 檢查 `TouchInputAdapter.ts` 是否正確初始化

---

## 📱 Google Play Console 上架流程

### 1. 創建應用程式

1. 前往 [Google Play Console](https://play.google.com/console)
2. 點擊「創建應用程式」
3. 填寫應用程式名稱和詳細資訊

### 2. 上傳 AAB

1. 進入「發布」→「正式版」
2. 點擊「創建新版本」
3. 上傳 `app-release.aab`
4. 填寫版本說明

### 3. 完成商店資訊

- 應用程式圖示（512x512）
- 功能圖片（1024x500）
- 螢幕截圖（至少 2 張）
- 應用程式說明
- 隱私權政策連結

### 4. 內容分級

完成內容分級問卷

### 5. 提交審核

點擊「提交審核」，等待 Google 審核（通常 1-3 天）

---

## 🎯 MVP 版本重點

這是 **最小可行產品（MVP）** 版本，目標是：

1. ✅ 快速上架測試
2. ✅ 驗證核心玩法
3. ✅ 收集玩家反饋
4. ❌ 不包含完整商業功能（存檔、課金、廣告等）

後續可以根據玩家反饋逐步添加功能。

---

## 📞 需要幫助？

如果遇到問題，請檢查：
1. Node.js 版本是否 >= 18
2. Android Studio 是否正確安裝
3. Java JDK 是否為版本 17
4. 環境變數 `ANDROID_HOME` 是否設定

---

**祝您上架順利！🎉**
