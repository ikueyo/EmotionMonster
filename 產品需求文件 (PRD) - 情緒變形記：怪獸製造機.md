產品需求文件 (PRD) - 情緒變形記：怪獸製造機

專案名稱： 情緒怪獸製造機 (Emotion Monster Maker)

版本： v1.0 (MVP 階段)

對應教材： 《安妮新聞》Vol. 10 腦筋急轉彎 (Die Verwandlung / 變形記)

目標受眾： 國小中高年級學生 (9-12歲)

核心概念： 透過「表現性藝術」將抽象情緒轉化為具體的 3D 怪獸形象。

1. 產品概述 (Product Overview)

1.1 背景與動機

本專案旨在結合實體藝術創作與數位互動科技。靈感源自卡夫卡的《變形記》，引導學生思考：「如果今天早晨醒來，我的情緒把我變成了一隻怪獸，那會長什麼樣子？」。透過 Three.js 技術，讓學生在瀏覽器中組裝、彩繪並賦予怪獸生命，達成情緒覺察與釋放的教學目標。

1.2 設計美學 (Aesthetic & Style)

視覺風格： 高品質玩具質感 (Toy Aesthetic)。

關鍵字： 霧面軟膠 (Soft Vinyl)、扭蛋公仔、粉嫩色調、無害感。

材質設定： 低金屬感 (Metalness: 0)、高粗糙度 (Roughness: 0.6)、半球光照明 (Hemisphere Lighting)。

2. 使用者流程 (User Journey)

實體創作 (Physical Creation)：

學生使用專用學習單（中央有圓形黑框的 A4 圖紙）。

利用蠟筆或彩色筆，在圓框內畫出代表當下情緒的顏色與花紋（無需具象圖案）。

數位組裝 (Digital Assembly)：

開啟 App，畫面上是一個素坯怪獸身體。

從左側選單拖曳五官與肢體，組裝出怪獸的形態。

點擊部件進行旋轉與角度微調。

虛實整合 (Texture Mapping) [待整合]：

點擊「皮膚掃描」按鈕。

鏡頭對準學習單圓框，將實體畫作轉化為怪獸的皮膚貼圖。

展示與反思 (Reflection)：

怪獸在畫面上呼吸律動。

截圖保存，並撰寫「怪獸飼養指南」（情緒照顧策略）。

3. 功能需求 (Functional Requirements)

3.1 核心舞台 (The Stage)

場景渲染： 使用 Three.js 建立 3D 場景。

光照系統：

主光：HemisphereLight (天空冷白 + 地面暖橘) 模擬攝影棚環境光，避免死黑陰影。

輔光：DirectionalLight 產生柔和陰影。

輪廓光：SpotLight 勾勒邊緣。

怪獸素坯：

造型：水滴型 (基於 SphereGeometry 的頂點變形)，上窄下寬。

動態：持續進行 Math.sin 驅動的呼吸與懸浮動畫。

3.2 部件組裝系統 (Assembly System)

拖曳生成 (Drag & Drop)：

左側提供部件按鈕 (手、腳、眼、嘴)。

按住按鈕拖曳至 3D 空間，放開後實體化。

限制： 每次拖曳操作僅生成一個部件，避免重複點擊造成的物件堆疊。

自動吸附 (Auto-Snap)：

利用 Raycaster 偵測怪獸身體表面。

部件自動根據表面法線 (Normal) 轉向，確保垂直於皮膚。

無縫關節技術： 設定 PENETRATION_DEPTH = 0.15，讓部件根部嵌入身體內部，模擬球型關節，旋轉時不穿幫。

3.3 部件規格 (Parts Catalog)

所有部件皆需具備 canGlow: true 屬性以便選取，但需排除細節 (如瞳孔、牙齒)。

部件

造型描述

特殊邏輯

眼睛

圓球眼白 + 黑色瞳孔 + 眼神光點

瞳孔與光點不發光，保持眼神清晰。

嘴巴

飽滿的深紅色膠囊型，上緣附有兩顆白色尖牙

牙齒位於嘴唇內側上緣，尖端朝下。

手臂

圓柱手臂 + 球型拳頭 + 三根圓潤手指

預設長度需包含嵌入深度補償。

腿部

圓柱腿部 + 扁圓腳掌 + 三顆圓潤腳趾

預設長度需包含嵌入深度補償。

3.4 編輯與微調 (Editing & Manipulation)

選取機制：

新建即選取： 拖曳放置後，自動進入選取狀態。

點擊選取： 點擊怪獸身上的部件即可選取。

視覺回饋： 選取的部件會發出柔和的白色光暈 (Emissive)，但排除黑色瞳孔與牙齒 (Smart Highlight)。

控制面板 (Control Panel)：

僅在選取部件時從下方彈出。

滑桿 A (自轉)： 控制 Y 軸旋轉 (360度)。

滑桿 B (開合/傾斜)： 控制 Z 軸角度 (約 +/- 60度)，用於做出張開手、鬥雞眼等表情。

刪除按鈕： 移除當前選取的部件。

3.5 實體圖紙設計 (Physical Constraints)

格式： A4 尺寸。

識別區： 中央直徑 16cm 的圓形粗黑框。

定位點： 圓框四角設有十字定位標記 (Fiducial Markers) 以利未來擴充自動裁切功能。

4. 技術架構 (Technical Stack)

前端框架： 原生 HTML5 / JavaScript (ES6 Modules)。

3D 引擎： Three.js (r160+)。

互動控制： OrbitControls (視角控制)、Raycaster (點擊與拖曳偵測)。

渲染優化：

renderer.shadowMap.type = THREE.SoftShadowMap (柔和陰影)。

renderer.setPixelRatio (適配視網膜螢幕)。

5. 待開發項目 (Roadmap)

Phase 2: 皮膚掃描整合 (Texture Mapping)

功能： 點擊相機按鈕 -> 呼叫 WebRTC (getUserMedia)。

實作：

擷取鏡頭畫面。

利用 Canvas 裁切畫面中央的正方形或圓形區域。

將圖片轉為 THREE.Texture。

應用於怪獸身體材質 (map 屬性)。

進階處理： 實作 UV 邊緣暈染，讓貼圖在怪獸背面自然過渡，而非產生明顯接縫。

Phase 3: 存檔與分享

功能：將當前的 Canvas 畫面匯出為 PNG 圖片，供學生下載保存。

6. 已知限制 (Constraints)

瀏覽器相容性： 需確保在學校常見的 iPad (Safari) 與 Chrome 上 WebGL 運作順暢。

效能： 部件數量若過多 (例如超過 50 個) 可能影響低階平板效能，需在程式端設定上限 (雖目前未硬性限制)。