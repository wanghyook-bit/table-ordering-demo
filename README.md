# 桌码点餐 H5（桌码 1.2）

顾客扫码点餐 H5，390×844 设计稿，繁体中文 / English 双语。

- 线上地址：https://wanghyook-bit.github.io/table-ordering-demo/
- 发布分支：`main`，发布目录 `/docs`

## 目录结构

```
src/            源码（唯一改动入口）
public/         静态资源（trial.html、图片、robots.txt）
docs/           构建产物，GitHub Pages 直接发布这里，不要手改
index.html      Vite 入口
vite.config.ts  构建配置（outDir = docs）
```

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建与发布

```bash
# 1. 构建（必须带 FIGMA_PUBLIC_URL，否则资源路径会指向根目录）
FIGMA_PUBLIC_URL=/table-ordering-demo pnpm build

# 2. 提交源码和产物
git add -A
git commit -m "说明这次改了什么"

# 3. 推送，GitHub Pages 会自动发布 docs/
git push origin main
```

## 注意事项

- **`docs/` 是产物，不要手改**，每次构建会整体覆盖。
- `src/index.css` 里有 `@source not "../docs"`，防止 Tailwind 扫描产物目录导致构建结果漂移。不要删。
- `docs/component-inventory.md` 之类被 Tailwind 扫描后会影响 CSS token 输出（例如 `--color-warning`），删文档会导致构建 hash 变化。
- 历史版本：tag `v1.0-dist` 是重构前的纯产物仓库快照（commit 5094853）。

## 版本基线

当前 `main` 首个提交与线上 `v1.0-dist`（5094853）产物逐字节一致：

- JS `04dc622124b8c2cda0344b1bcb450d7780378cff2b969d9200682bf98efcfbaf`
- CSS `2297bc54a6cd3cb94bd6f2471f7cb66bc5b7fb57d22bd7e75d56a5551fdbd331`
