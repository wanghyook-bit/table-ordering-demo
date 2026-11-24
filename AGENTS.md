# 桌码点餐 H5 · 工作说明

顾客扫码点餐 H5。设计稿 390×844，繁体中文 / English 双语。

- 线上：https://wanghyook-bit.github.io/table-ordering-demo/
- 仓库：https://github.com/wanghyook-bit/table-ordering-demo
- 发布：`main` 分支 / `docs` 目录

---

## 1. 目录结构

```
src/            源码，唯一改动入口
public/         静态资源（trial.html、图片、robots.txt）
docs/           构建产物，GitHub Pages 直接发布；不要手改
index.html      Vite 入口，挂载 #root，加载 src/main.tsx
vite.config.ts  base 由 FIGMA_PUBLIC_URL 控制，outDir = docs
dev-notes/      组件盘点等文档（会影响构建，见 §5）
```

主要源码文件：

- `src/main.tsx` — 入口，引入 `src/index.css`，挂载 `src/App.tsx`
- `src/App.tsx` — 主界面与页面路由
- `src/components/` — `menu / confirm / orders / pay / member / pricing / store / ui / Welcome`
- `src/data.ts` — 文案与菜单数据（双语）
- `src/index.css` — Tailwind 入口与设计 token

## 2. 改动流程

**不要直接在 main 上改。** main 只接受合并，每一件事都从 main 拉一个新分支。

```bash
cd /Users/yanghao/Desktop/桌码1.2-仓库

# 1. 从最新 main 拉分支（分支名说明这件事做什么）
git checkout main
git pull origin main
git checkout -b feat/order-success-toast

# 2. 只改 src/ 和 public/

# 3. 类型检查
npx tsc --noEmit

# 4. 构建（必须带 FIGMA_PUBLIC_URL，否则资源路径会错）
FIGMA_PUBLIC_URL=/table-ordering-demo pnpm build

# 5. 本地预览核对
npx vite preview --outDir docs

# 6. 提交到分支（源码 + 产物一起，保持一一对应）
git add -A
git commit -m "feat: 下单成功提示"
git push -u origin feat/order-success-toast

# 7. 自测通过后再合并回 main
git checkout main
git pull origin main
git merge --no-ff feat/order-success-toast
git push origin main
```

`docs/` 会随构建整体重写，和源码在同一个 commit 里，一一对应。

### 分支命名

```
feat/xxx     新功能或交互改动
fix/xxx      修 bug
style/xxx    只改视觉，不动逻辑
docs/xxx     只改文档
```

### 两条必须知道的约束

1. **只有 main 会部署。** 分支推上去线上不会变，分支上的改动只能在本地 `vite preview` 看。
2. **`docs/` 冲突不要手工合并。** 产物文件名带 hash，两个分支同时改一定冲突。
   正确做法：合并时如果 `docs/` 报冲突，直接放弃这一侧，在合并后的源码上重新构建覆盖：

```bash
git checkout --ours docs/        # 或先 git merge --abort 再重来
FIGMA_PUBLIC_URL=/table-ordering-demo pnpm build
git add docs/
git commit
```

**永远不要去手改 `docs/assets/*.js` 解决冲突。**

## 3. 硬规则

1. **不要手改 `docs/`**，下次构建会覆盖。
2. **不要删 `src/index.css` 里的 `@source not "../docs"`**，删了会导致构建漂移。
3. **不要提交 `node_modules`**，包括软链。
4. **不要擅自改文案**。增删措辞、换字（如「登陸 / 登入」）必须明确授权。
5. **不要擅自改视觉**（间距、字号、颜色、圆角、组件结构）。视觉改动必须指定基准版本。
6. 改完必须给验证证据（hash / 截图），不能只说「改好了」。
7. 一次只推进一个决定或一个页面，不要顺手重做别的地方。
8. **不要直接在 main 上改。** 每件事拉一个新分支，自测通过再合并回 main。
9. **不要在分支上手工合并 `docs/`。** 冲突就重新构建覆盖，禁止手改产物。

## 4. 验收标准

- `npx tsc --noEmit` 无报错
- `docs/index.html` 里的资源路径是 `/table-ordering-demo/assets/...`
- 线上 JS/CSS 与本地构建 hash 一致
- 390×844 截图核对改动的页面
- 连续构建两次，两次 hash 必须相同

## 5. 已知的坑（踩过的，别再踩）

### Tailwind v4 会扫描整个仓库
产物放进 `docs/` 后，第二次构建会把产物里的类名再喂回 CSS，导致 CSS 变大、hash 漂移。
解法：`src/index.css` 顶部有 `@source not "../docs"`，**永久保留**。

### 文档内容也会影响 CSS 输出
Tailwind 会扫描 `dev-notes/*.md`。`component-inventory.md` 里出现过 `warning` 字样，
CSS 才生成了 `--color-warning`。删掉这个文档，CSS 就少 24 字节、hash 变化。
**清文档前先构建对比 hash，不要凭直觉删。**

### Pages 改配置后不会自动重新发布
改 `source` 到 `main /docs` 后，线上可能仍是旧内容。需要手动触发：

```bash
gh api -X POST repos/wanghyook-bit/table-ordering-demo/pages/builds
gh api repos/wanghyook-bit/table-ordering-demo/pages/builds --jq '.[0].status'
```

等到 `built` 再验线上。

### 这个仓库曾经只有产物
2026-11-24 之前，仓库只有编译后的 JS/CSS，源码从未入库，导致完全无法回溯。
现在的源码是按会话日志逐个 patch 重放还原的，已用产物 hash 逐字节验证。
**以后任何改动都必须走 `src/`，禁止直接改 `docs/assets/*.js`。**

### 金额口径
固定六项：小計 / 服務費 / 優惠 / 總計 / 已付 / 剩餘應付。
不要出现「預計應付 / 應付合計 / 本次已付」这类同义混用。

### 后付流程
提交订单 → 直接进订单详情，**绝不进支付页**。
首单可走人工接单（等待商家接單）；拒单后不得付款、不出厨房单。

## 6. 版本与回滚

- `v1.0-dist`：重构前的纯产物快照（commit `5094853`），随时可回到旧版
- 线上回滚：Pages 改回 `main /`，或把 `docs/` 换成该 tag 的产物

## 7. RSI：迭代经验记录

每次踩到新坑，追加一行。写清**现象 / 原因 / 解法**，不要写「要注意一下」这种空话。

| 日期 | 现象 | 原因 | 解法 |
| --- | --- | --- | --- |
| 2026-11-24 | 二次构建 CSS 变大，hash 漂移 | Tailwind v4 扫描 `docs/` 产物 | `@source not "../docs"` |
| 2026-11-24 | 删文档后 CSS 少一个 token | Tailwind 扫描 md 里的字样 | 清文档前构建对比 hash |
| 2026-11-24 | Pages 改配置后线上仍是旧内容 | 改配置不触发新构建 | 手动 POST `pages/builds` |
| 2026-11-24 | 源码无法回溯 | 历史仓库只提交产物 | 源码入库，产物进 `docs/` |
| 2026-11-24 | 全部改动堆在 main，出问题难回退 | 没有分支习惯 | 一事项一分支，合并前自测 |

## 8. 技术栈

- React 19 + Vite 8 + TypeScript 5.7
- Tailwind CSS v4（`@tailwindcss/vite`，无 tailwind.config）
- 格式化：oxfmt

### Tailwind 用法补充

`src/index.css` 用 `@import 'tailwindcss';` 引入。直接在 JSX 里写 utility class，
全局样式和主题 token 写在 `src/index.css` 的 `@theme` 里。

`@import` 必须放在最前面。全局元素样式（body、heading、button、input）放进
`@layer base { ... }`，否则会盖掉元素上的 utility class。
Preflight 已经处理了 `box-sizing`、默认 margin、表单 `font: inherit`，不要重复写。
