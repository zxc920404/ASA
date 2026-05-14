# 🚀 快速啟動指南

## 📱 從零到上架 Google Play

### ⚡ 5 分鐘快速測試

```bash
# 1. 安裝依賴（如果還沒安裝）
npm install

# 2. 開發模式運行
npm run dev

# 3. 在瀏覽器中打開
# http://localhost:5173
```

**測試要點：**
- 使用 WASD 鍵移動角色
- 觀察三種武器自動攻擊
- 收集經驗球升級
- 查看 UI 顯示

---

### 📦 構建生產版本

```bash
# 構建 Web 版本
npm run build

# 預覽構建結果
npm run preview
```

構建產物位於 `dist/` 目錄。

---

### 📱 Android 打包（首次）

#### 前置需求
- ✅ Node.js >= 18
- ⏳ Android Studio
- ⏳ Java JDK 17

#### 步驟

```bash
# 1. 構建 Web 應用
npm run build

# 2. 新增 Android 平台（首次執行）
npx cap add android

# 3. 同步資源到 Android
npx cap sync android

# 4. 打開 Android Studio
npx cap open android
```

#### 在 Android Studio 中

1. 等待 Gradle 同步完成（首次需要下載依賴，可能需要 5-10 分鐘）
2. 連接實機或啟動模擬器
3. 點擊綠色播放按鈕 ▶️ 運行應用
4. 測試觸控搖桿和遊戲功能

---

### 🔑 創建簽名金鑰（上架必須）

```bash
# 在專案根目錄執行
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**重要：**
- 記住密碼！
- 備份 `release.keystore` 檔案！
- 遺失金鑰將無法更新應用！

---

### 📦 生成 AAB（上架格式）

#### 方法 1：Android Studio（推薦）

1. **Build** → **Generate Signed Bundle / APK**
2. 選擇 **Android App Bundle**
3. 選擇或創建 Keystore
4. 選擇 **release** 建置類型
5. 點擊 **Finish**

AAB 檔案位置：
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### 方法 2：命令列

```bash
cd android
./gradlew bundleRelease
```

---

### 🎮 測試清單

#### 桌面瀏覽器測試
- [ ] 遊戲啟動
- [ ] WASD 移動
- [ ] 武器自動攻擊
- [ ] 經驗球收集
- [ ] 升級系統
- [ ] 死亡結算

#### 手機實機測試
- [ ] 觸控搖桿顯示
- [ ] 搖桿控制移動
- [ ] 武器自動攻擊
- [ ] 經驗球收集
- [ ] 升級卡片點擊
- [ ] UI 顯示正常
- [ ] 效能流暢（30+ FPS）

---

### 📱 上架 Google Play

#### 1. 準備資料

- [ ] AAB 檔案
- [ ] 應用程式圖示（512x512 PNG）
- [ ] 功能圖片（1024x500 PNG）
- [ ] 螢幕截圖（至少 2 張）
- [ ] 應用程式說明（中文 + 英文）
- [ ] 隱私權政策連結

#### 2. Google Play Console

1. 前往 https://play.google.com/console
2. 創建應用程式
3. 上傳 AAB
4. 填寫商店資訊
5. 完成內容分級
6. 提交審核

#### 3. 等待審核

- 通常 1-3 天
- 審核通過後自動上架

---

### 🐛 常見問題

#### Q: npm run build 失敗

```bash
# 清除快取重試
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

#### Q: Android Studio 找不到 SDK

1. 打開 Android Studio
2. **Tools** → **SDK Manager**
3. 安裝 **Android SDK Platform 34**
4. 設定環境變數 `ANDROID_HOME`

#### Q: 觸控搖桿不顯示

- 確認在實機或模擬器上測試（瀏覽器不會顯示）
- 檢查 `InputController.ts` 是否正確偵測觸控裝置

#### Q: Gradle 建置失敗

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

---

### 📚 詳細文檔

- **MVP 完成總結**: `MVP_COMPLETION_SUMMARY.md`
- **Capacitor 打包指南**: `CAPACITOR_SETUP.md`
- **專案結構**: 查看 `src/` 目錄

---

### 🎯 下一步

1. ✅ 完成本地測試
2. ⏳ Android 打包測試
3. ⏳ 實機測試
4. ⏳ 上架 Google Play
5. ⏳ 收集玩家反饋
6. ⏳ 迭代優化

---

### 💡 提示

- **開發模式**: `npm run dev` - 熱重載，快速測試
- **生產構建**: `npm run build` - 優化壓縮
- **Android 同步**: `npx cap sync` - 更新 Android 資源
- **Android 運行**: `npx cap run android` - 直接運行到裝置

---

### 📞 需要幫助？

檢查以下文檔：
1. `MVP_COMPLETION_SUMMARY.md` - 功能清單
2. `CAPACITOR_SETUP.md` - 詳細打包指南
3. `README.md` - 專案說明

---

**祝您開發順利！🎉**
