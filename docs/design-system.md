# Luma・Gran 流光 — 设计风格提炼指南

> 目的：把本项目沉淀下来的视觉与交互语言提炼为可复用规范，让你在生成新的同风格网页时只需引用本指南 + 令牌文件即可复现一致体验。

---

## 一、核心理念（一句话）

**Windows Fluent 设计语言 + 极简微光**：云母（Mica）/ 丙烯酸（Acrylic）双层材质、纯色大面 + 极淡辉光点缀、双主题自动适配、每个可交互元素都带质感响应（3D 倾斜 / 鼠标球 / 光晕跟随 / 水波纹切换）。

**关键词**：Fluent / Mica 云母 / 玻璃拟态 / 光场（Light Field）/ 视差 / 粒子 / 沉浸深色 + 通透浅色 / 极简微光 / 非线性动效。

---

## 二、设计令牌（Design Tokens）

> 完整可粘贴的 CSS 变量见同目录 `design-tokens.css`，两主题通过 `[data-theme="light"]` 覆盖同套变量。

### 1. 色彩系统

| 层 | 深色（默认） | 浅色 `[data-theme=light]` | 用途 |
|---|---|---|---|
| `--bg-base` | `#000000` | `#f5f5f7` | 页面底色 |
| `--bg-layer` | `#0a0a0c` | `#ebebef` | 次级层 |
| `--bg-card` | `#121216` | `#ffffff` | 卡片 |
| `--bg-card-hover` | `#1a1a20` | `#f0f0f4` | 卡片悬停 |
| `--bg-acrylic` | `rgba(20,20,26,.5)` | `rgba(255,255,255,.6)` | 丙烯酸玻璃 |
| `--bg-mica` | `rgba(10,10,14,.65)` | `rgba(245,245,247,.75)` | 云母背景 |

- **文字 4 层**：`--text-primary`（白/#000）、`--text-secondary`（`.72`）、`--text-tertiary`（`.45`）、`--text-disabled`（`.25`）。
- **边框 3 层**：`--border-subtle(.06)` / `--border-default(.1)` / `--border-strong(.16)`。
- **强调色**：`--accent = 纯白`（深色），`--accent-light` / `--accent-dark` 灰阶。强调即中性白，克制不用彩色。
- **微光"光场"**：`--glow-white = rgba(255,255,255,.05)`、`--glow-gray`、`--accent-glow = rgba(255,255,255,.18)`。
- **材质遮罩**：深色模式毛玻璃遮罩用黑色，浅色模式用白色。

### 2. 排版

- 字体：**鸿蒙 HarmonyOS Sans SC**（可变字重 `100–900`）。加载方式：项目内置 `assets/fonts/HarmonyOS_Sans_SC.ttf`，用 `@font-face { font-family:"HarmonyOS Sans SC"; src:url("../assets/fonts/HarmonyOS_Sans_SC.ttf") format("truetype"); font-weight:100 900; }` 声明后，`body{ font-family:"HarmonyOS Sans SC",system-ui,-apple-system,sans-serif; }`。
- 字号（clamp 响应式）：`--fs-hero: clamp(36px,6vw,56px)`；`--fs-h1: clamp(28px,4vw,40px)`；`--fs-h2: clamp(22px,3vw,28px)`；`--fs-h3 18px`；`--fs-body 14px`；`--fs-small 12.5px`；`--fs-caption 11px`。

### 3. 间距 / 圆角 / 阴影

- 间距：4px 基准 `--space-1…space-20`（4/8/12/16/20/24/28/32/36/40/48/64/80）。
- 圆角：`--radius-sm:6 / md:8 / lg:12 / xl:16 / 2xl:20`（全用 rem 感、克制）。
- 阴影：三级 `--shadow-1/2/3`（阴影随层级加深）+ `--shadow-glow: 0 0 24px rgba(255,255,255,.1)`。

### 4. 动效令牌

| 令牌 | 值 | 语义 |
|---|---|---|
| `--ease-fluent` | `cubic-bezier(.1,.9,.2,1)` | 标准 Fluent 缓动 |
| `--ease-fluent-in` | `cubic-bezier(.7,0,.9,.3)` | 进入减速 |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | 回弹（弹簧） |
| `--ease-soft` | `cubic-bezier(.22,1,.36,1)` | 软缓动（卡片退出） |
| `--dur-fast:150 / normal:250 / slow:400 / slower:600` ms | | 时长层级 |

---

## 三、标志性动效（必须复现的成功体验）

### 1. 首屏入场序列（粒子 → 背景渐清 → 主体）
1. 粒子由**作品主图 15px 高斯模糊**版本采样生成粒子形状，做聚集动画。
2. 背景 `blur 30px → 0` 于 `1.2s` 渐变清晰。
3. 依次淡入：主体（粒子聚集后 `400ms` 延迟）→ 头像 → 文本。
4. **三保险**：图片加载失败立即显示内容 / `5s` 超时强制显示 / `prefers-reduced-motion` 直接显示。

### 2. 主题切换水波纹
从切换按钮中心发起**圆形遮罩**，`600ms ease-out` 扩展到全屏 → 遮罩期间切换主题 → 遮罩 `300ms` 淡出。带防重复点击保护与 `reduced-motion` 降级。

### 3. 3D 卡片
参数：**max tilt 18°**、**LERP 插值系数 0.15**、**停止阈值 0.05°**、`perspective(800–1200px)`。鼠标位置反方向位移 + 同方向旋转。旋转轴心（`transform-origin`）可调：想让**卡片下半部分响应更明显**，把轴心抬高或缩小可视角度。

### 4. 鼠标球（iPadOS 风格形变光标）

**三态状态机**
- `normal`：`22px` 正圆，**线性 1:1 跟随**，无形变（不设 LERP，避免 `translate` 缓动导致位置错位）。
- `card`：移入卡片/数据面板等**大板块**时整球彻底隐藏（`opacity:0`，实体球 + 光环均不可见）；hover 反馈由卡片自身 `::before` 表面辉光承担——**辉光已增大（`360px` circle、`color-mix` 85% → transparent 80%）更柔更模糊**。**点击板块时辉光从点击点水波式扩散到整个板块（`.ripple`，600ms ease-out 放大 + 淡出，凭 `overflow:hidden` 裁切在板块内）。**
- `button`：进入可操作控件时选中框粘滞吸附（`0.3` LERP 吸附控件中心 + **20%** 粘滞偏移）。**选中框外扩只适用于"无背景且无框线"的控件**（纯文字链接 / 透明按钮 / logo），用 `PAD=4px` 略大一圈"套住"控件；**自身带背景或框线的控件已有视觉边界，选中框贴合控件本身尺寸（`PAD=0`）**。**分段 Tab 栏的选中与未选中框统一贴合 tab 实际尺寸（`PAD=0`），与选中态等高、保持一致不再放大。**控件用 CSS `translate` 做等量微位移（不覆盖现有 `transform`）。**选中框内部有一层径向辉光（`::after`）跟随鼠标移动（`--spot-x/--spot-y` 相对选中框左上角），辉光半径 `--spot-r` 随控件尺寸自适应（`≈ max(宽,高)×1.3`），顶栏等小型控件不显过大；凭 `border-radius` 裁切在选中框内、不外溢，选中框本身只留 1px 灰描边轮廓。**
- 作用于所有可操作组件：`button/.tab/.chip/.theme-toggle/.nav-links a/.logo/a[href]`（**Tab 栏/分段控件**、导航、按钮、开关、Logo、链接）。粘滞优先在最常见的可操作面上体现——Tab 栏、按钮、链接、开关都应触发选中框跟随。
- 颜色统一半透明灰 `rgba(128,128,128,·)`（default `.22` / hover `.12` / pressed `.4` / sticky `.12`），**不做主题/区域区分**。
- 仅在 `pointer:fine` 且非 `prefers-reduced-motion` 时启用，否则保留系统光标。

**关键参数**
| 项 | 值 |
|---|---|
| 实体球默认 | 22×22px 正圆，bg `.22 + 边框 1.5px .5` |
| 按钮形变 | inner = 控件宽高 + 外扩；**无背景无框线时 `PAD=4px` 外扩套住，有背景/框线时 `PAD=0` 贴合**；**分段 Tab 栏统一贴合（`PAD=0`，选中/未选中同尺寸）**；borderRadius 跟随控件圆角，非圆则回退 8px（圆钮 ≤40 且方宽高比判 `50%`） |
| button 粘滞 | 鼠标与按钮中心差 × `0.2`；外层 LERP `0.3` |
| 选中框光影 | 选中框内 `::after` 径向辉光**跟随鼠标**（`--spot-x/--spot-y` 相对选中框左上角），半径 `--spot-r≈max(宽,高)×1.3` 适配小控件；凭 `border-radius` **裁切在框内**、不外溢；选中框只留 1px 灰描边 |
| 大板块辉光 | 板块 `::before` 径向辉光 **`360px` circle、`color-mix 85%→transparent 80%`（更大更模糊）**；点击时 `.ripple` 从点击点水波式扩散到全板块（600ms ease-out 放大+淡出） |
| 形态过渡 | `width/height` `0.3s` 弹簧；`border-radius` `0.12s` 快速归圆（避免退出时闪现方形） |

**实现骨架（可直接复用）**
```html
<div class="cursor-glow" id="cursorGlow" aria-hidden="true">
  <div class="cursor-glow-inner" id="cursorGlowInner"></div>
</div>
```
```css
/* 点锚：容器 0×0，inner/光环 translate(-50%,-50%) 居中，球心精确贴光标 */
.cursor-glow { position: fixed; left:0; top:0; width:0; height:0;
  pointer-events:none; z-index:9998;
  transform: translate(-9999px,-9999px); will-change:transform; }
.cursor-glow::before {           /* 外层微光环：默认不常驻，仅 card 亮起 */
  content:""; position:absolute; top:0; left:0;
  width:56px; height:56px; border-radius:50%; opacity:0;
  background: radial-gradient(circle, color-mix(in srgb, var(--text-primary) 8%, transparent) 40%, transparent 72%);
  transform: translate(-50%,-50%); }
.cursor-glow-inner { position:absolute; top:0; left:0;
  width:22px; height:22px; border-radius:50%;
  background: rgba(128,128,128,.22); border:1.5px solid rgba(128,128,128,.5);
  transform: translate(-50%,-50%);
  transition: width .3s var(--ease-spring), height .3s var(--ease-spring),
              border-radius .12s var(--ease-fluent), background .3s var(--ease-fluent),
              border-color .3s var(--ease-fluent), opacity .2s ease; }
.cursor-glow.card { opacity:0; }
body.sel-active, body.sel-active * { cursor:none !important; }
```
```js
// 循环：normal 线性 / button 缓动吸附；mouseover/mouseout 切换三态
// 核心：normal 直接 = 鼠标坐标；button 向 目标中心+粘滞 做 0.3 LERP；
// button 退出时清空 inner 内联样式回到 22px 正圆。
// 完整实现见 examples/luma-gran-showcase.html 底部脚本。
```

### 5. 卡片 / 按钮光晕
- `--mouse-x/--mouse-y`（像素级 `--mouse-x-px/--mouse-y-px`）驱动的 `radial-gradient` 跟随鼠标。
- 大按钮 `22px blur 25%`、小按钮 `16px blur 25%`、卡片同用径向辉光。
- Hover 采用**高亮/压暗 + glow 阴影**（`0 0 12px --accent-glow`），**不用位移**。
- Footer 链接小圆角 `6px`，用 `::after`（`inset:-15px`，容器 `overflow:visible`）渲出界光晕，大小比目标大 `8px`。

### 5.1 板块点击水波（点击辉光扩散到全板块）
点击大板块时，辉光从点击点**水波式扩散到整个板块**再淡出，凭板块 `overflow:hidden + border-radius` 裁切在板块内。适用：`.card / .grant-card / .work-card / .contact-card`（凡 `position:relative; overflow:hidden` 的板块）。

**CSS（追加）**
```css
.ripple {
  position: absolute; width: 12px; height: 12px; border-radius: 50%;
  pointer-events: none; z-index: 1; opacity: 0.5;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(circle, var(--accent-glow, rgba(255,255,255,.18)), transparent 65%);
}
.ripple.pop {
  transition: transform 600ms ease-out, opacity 500ms ease;
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
}
```
**JS（事件委托）**
```js
document.addEventListener("click", (e) => {
  const el = e.target.closest(".card, .grant-card, .work-card, .contact-card"); // 按页面板块选择器
  if (!el) return;
  const r = el.getBoundingClientRect();
  const ripple = document.createElement("div");
  ripple.className = "ripple";
  const size = Math.max(r.width, r.height) * 2.4;   // 扩散尺寸：覆盖整个板块
  ripple.style.left = (e.clientX - r.left) + "px"; // 从点击点发起
  ripple.style.top = (e.clientY - r.top) + "px";
  ripple.style.width = size + "px";
  ripple.style.height = size + "px";
  el.appendChild(ripple);
  requestAnimationFrame(() => requestAnimationFrame(() => ripple.classList.add("pop")));
  setTimeout(() => ripple.remove(), 700);
});
```
要点：`scale(0)→scale(1)` 600ms `ease-out` 放大 + 同步淡出；`pointer-events:none` 不影响点击跳转；`reduced-motion` 时 `transition:none` 自动降级为瞬时无动画。

### 6. 分类切换动画（作品集）
退场：`blur→12px + scale(0.88) + 淡出 0.3s`；入场：`blur 12px + scale(0.9) → 清晰 + scale(1) 0.4s`（纯 `@keyframes`，切换用一个 300ms 定时器重建网格）。

---

## 四、交互与可访问性约定

- 链接 Hover = 高亮 + `0 0 12px` 辉光，**非位移**。
- 卡片点击后 `0.3s` 渐消失，退出时长 `400ms`、`cubic-bezier(.22,1,.36,1)`。
- SVG Logo 一律 `currentColor`，随主题自动变色。
- 重要元素提供 `prefers-reduced-motion` 降级；按钮/卡片带 `aria-pressed`/`role` 语义。
- 深浅色切换用水波纹；首屏导航栏初始不衬背景，滚动后出现 Mica。

---

## 五、关键工程约束（复用避坑）

| 坑 | 对策 |
|---|---|
| `file://` + `crossOrigin` → `getImageData` CORS 失败 | 粒子采样源用 **base64 data URL**，勿设 `crossOrigin` |
| 粒子初始化异常导致首屏消失 | `initParticles` 整体 `try-catch`，失败跳过不阻塞 |
| 入场 `animation-fill-mode: both` 会锁死 JS 3D transform | 入场动画**去掉 fill**，把 transform 交还 JS |
| fade-in 观察者与新类冲突 | 切换渲染路径显式 `classList.remove("fade-in")` |
| 图片打开有空白等待 | `<link rel=preload>` + `Image()` 提前解码 + `fetchpriority=high` |

---

## 六、给 AI 风格调用指令（Prompt 片段）

> 生成同风格网页时，可直接附加：

```
请采用"Luma・Gran 流光"设计风格：Windows Fluent / Mica 云母玻璃拟态，
双主题(CSS变量驱动，深色默认+浅色[data-theme=light])；HarmonyOS Sans SC 字体；
4px 间距基准，圆角 6↔20px，纯白强调色+极淡辉光(0 0 12px，准确性白12%透明度)；
标准缓动 cubic-bezier(.1,.9,.2,1)，回弹 cubic-bezier(.34,1.56,.64,1)；
交互质感：3D卡片(最大倾斜18°、LERP0.15)、鼠标球三态、卡片/按钮 hover 辉光跟随、
主题切换水波纹、入口粒子+背景渐清序列。链接 hover 用高亮压暗非位移。
令牌引用 docs/design-tokens.css。
```

---

## 七、文件清单

- `docs/design-tokens.css` — 可直接 `@import`/`<link>` 复用的两主题 CSS 变量。
- `docs/design-system.md` — 本规范（理念 / 令牌 / 动效 / 交互 / 约束 / 调用指令）。
- `examples/luma-gran-showcase.html` — 可复用验证示例页（完整演示 3D 卡片 / 鼠标球三态 / 水波纹 / 光晕跟随）。