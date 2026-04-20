# 需求文件

## 簡介

本文件定義了銷售點（POS）系統的功能需求。POS 系統用於零售環境中處理商品銷售交易，包括商品管理、購物車操作、結帳付款、收據生成及銷售報表等核心功能。系統旨在提供高效、準確的銷售流程管理。

## 術語表

- **POS_System**: 銷售點系統，處理零售交易的核心應用程式
- **Product_Catalog**: 商品目錄，儲存所有可銷售商品資訊的資料庫
- **Cart**: 購物車，暫存當前交易中顧客所選商品的容器
- **Cart_Item**: 購物車項目，購物車中的單一商品條目，包含商品資訊與數量
- **Transaction**: 交易，一次完整的銷售結帳流程
- **Receipt**: 收據，交易完成後產生的銷售憑證
- **Receipt_Printer**: 收據列印器，將交易資訊格式化並輸出為收據的元件
- **Payment_Processor**: 付款處理器，處理各種付款方式的元件
- **Inventory_Manager**: 庫存管理器，追蹤商品庫存數量的元件
- **Report_Generator**: 報表產生器，根據銷售資料產生統計報表的元件
- **Barcode_Scanner**: 條碼掃描器，透過掃描條碼識別商品的輸入裝置
- **Operator**: 操作員，使用 POS 系統進行銷售操作的店員

## 需求

### 需求 1：商品目錄管理

**使用者故事：** 身為操作員，我希望能管理商品目錄，以便維護最新的商品資訊供銷售使用。

#### 驗收標準

1. THE Product_Catalog SHALL 儲存每個商品的名稱、價格、條碼、分類及庫存數量
2. WHEN 操作員新增一個商品時，THE Product_Catalog SHALL 建立該商品記錄並設定初始庫存數量
3. WHEN 操作員修改商品資訊時，THE Product_Catalog SHALL 更新對應的商品記錄
4. WHEN 操作員刪除一個商品時，THE Product_Catalog SHALL 移除該商品記錄
5. WHEN 操作員以名稱或條碼搜尋商品時，THE Product_Catalog SHALL 回傳符合條件的商品清單
6. IF 操作員嘗試新增已存在相同條碼的商品，THEN THE Product_Catalog SHALL 拒絕新增並回傳重複條碼錯誤訊息

### 需求 2：條碼掃描與商品查詢

**使用者故事：** 身為操作員，我希望能透過掃描條碼快速查詢商品，以便加速結帳流程。

#### 驗收標準

1. WHEN Barcode_Scanner 掃描到一個條碼時，THE POS_System SHALL 在 Product_Catalog 中查詢對應的商品
2. WHEN 查詢到對應商品時，THE POS_System SHALL 顯示該商品的名稱、價格及庫存數量
3. IF 掃描的條碼在 Product_Catalog 中不存在，THEN THE POS_System SHALL 顯示「查無此商品」錯誤訊息

### 需求 3：購物車操作

**使用者故事：** 身為操作員，我希望能將商品加入購物車並調整數量，以便準確記錄顧客的購買內容。

#### 驗收標準

1. WHEN 操作員將一個商品加入 Cart 時，THE Cart SHALL 建立一個 Cart_Item 並設定數量為 1
2. WHEN 操作員將已存在於 Cart 中的商品再次加入時，THE Cart SHALL 將該 Cart_Item 的數量增加 1
3. WHEN 操作員修改 Cart_Item 的數量時，THE Cart SHALL 更新該 Cart_Item 的數量為指定值
4. WHEN 操作員移除一個 Cart_Item 時，THE Cart SHALL 從購物車中刪除該項目
5. WHEN 操作員清空 Cart 時，THE Cart SHALL 移除所有 Cart_Item
6. THE Cart SHALL 即時計算並顯示所有 Cart_Item 的小計金額與總金額
7. IF 操作員嘗試加入庫存數量為 0 的商品，THEN THE Cart SHALL 拒絕加入並顯示「庫存不足」訊息
8. IF 操作員設定的數量超過該商品的可用庫存，THEN THE Cart SHALL 拒絕修改並顯示「庫存不足」訊息

### 需求 4：折扣與優惠

**使用者故事：** 身為操作員，我希望能對商品或整筆交易套用折扣，以便處理促銷活動或會員優惠。

#### 驗收標準

1. WHEN 操作員對單一 Cart_Item 套用百分比折扣時，THE Cart SHALL 按照指定百分比計算該項目的折扣金額
2. WHEN 操作員對整筆交易套用百分比折扣時，THE Cart SHALL 按照指定百分比計算總金額的折扣
3. THE Cart SHALL 在小計與總金額中反映所有已套用的折扣
4. IF 操作員輸入的折扣百分比小於 0 或大於 100，THEN THE Cart SHALL 拒絕套用並顯示「折扣百分比無效」訊息

### 需求 5：付款處理

**使用者故事：** 身為操作員，我希望能處理多種付款方式，以便滿足不同顧客的付款需求。

#### 驗收標準

1. THE Payment_Processor SHALL 支援現金、信用卡及行動支付三種付款方式
2. WHEN 操作員選擇現金付款並輸入收到的金額時，THE Payment_Processor SHALL 計算並顯示應找零金額
3. WHEN 付款成功完成時，THE Payment_Processor SHALL 將 Transaction 標記為已完成狀態
4. IF 現金付款金額小於應付總額，THEN THE Payment_Processor SHALL 拒絕付款並顯示「金額不足」訊息
5. IF 付款處理過程中發生錯誤，THEN THE Payment_Processor SHALL 回傳錯誤訊息並保持 Transaction 為未完成狀態

### 需求 6：庫存更新

**使用者故事：** 身為操作員，我希望在交易完成後系統自動更新庫存，以便維持準確的庫存記錄。

#### 驗收標準

1. WHEN 一筆 Transaction 完成時，THE Inventory_Manager SHALL 根據該交易中每個 Cart_Item 的數量扣減對應商品的庫存
2. WHILE 一筆 Transaction 尚未完成，THE Inventory_Manager SHALL 保持商品庫存數量不變
3. IF 庫存扣減後某商品的庫存數量為 0，THEN THE Inventory_Manager SHALL 將該商品標記為「缺貨」狀態

### 需求 7：收據生成

**使用者故事：** 身為操作員，我希望在交易完成後能產生收據，以便提供給顧客作為購買憑證。

#### 驗收標準

1. WHEN 一筆 Transaction 完成時，THE Receipt_Printer SHALL 產生一份包含所有 Cart_Item 明細、折扣、總金額、付款方式及交易時間的 Receipt
2. THE Receipt_Printer SHALL 將 Receipt 格式化為可列印的文字格式
3. THE Receipt_Printer SHALL 將 Transaction 物件格式化為 Receipt 文字，再將 Receipt 文字解析回 Transaction 物件後，產生等價的 Transaction 物件（往返一致性）
4. IF 收據生成過程中發生錯誤，THEN THE Receipt_Printer SHALL 記錄錯誤並通知操作員

### 需求 8：銷售報表

**使用者故事：** 身為操作員，我希望能查看銷售報表，以便了解營業狀況與銷售趨勢。

#### 驗收標準

1. WHEN 操作員請求日報表時，THE Report_Generator SHALL 產生指定日期的銷售總額、交易筆數及商品銷售明細
2. WHEN 操作員請求月報表時，THE Report_Generator SHALL 產生指定月份的每日銷售摘要及月度總計
3. THE Report_Generator SHALL 依照銷售數量由高到低排序商品銷售明細
4. IF 指定的日期範圍內無任何交易記錄，THEN THE Report_Generator SHALL 回傳空報表並顯示「該期間無銷售記錄」訊息

### 需求 9：交易退貨

**使用者故事：** 身為操作員，我希望能處理退貨，以便在顧客需要退回商品時正確處理退款與庫存回補。

#### 驗收標準

1. WHEN 操作員輸入原始交易編號進行退貨時，THE POS_System SHALL 查詢並顯示該筆交易的明細
2. WHEN 操作員選擇退貨項目並確認時，THE POS_System SHALL 建立一筆退貨 Transaction 並記錄退款金額
3. WHEN 退貨 Transaction 完成時，THE Inventory_Manager SHALL 將退回商品的數量加回庫存
4. IF 操作員輸入的交易編號不存在，THEN THE POS_System SHALL 顯示「查無此交易」錯誤訊息
5. IF 該筆交易已經完成退貨，THEN THE POS_System SHALL 拒絕重複退貨並顯示「此交易已退貨」訊息
