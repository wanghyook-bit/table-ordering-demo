# H5 C 端组件盘点（2026-11-24）

范围：`src/App.tsx` + `src/components/*.tsx`，共 10 个文件、2,642 行。
判断标准：**是否被 2 个以上页面使用，且不含业务数据/业务文案**。两者都成立才进 `ui.tsx`。

## 一句话结论

基础库只需要 **12 类**；页面里还缺 **4 个基础件**；另有 **7 类业务组件**应放共享层但不进 `ui.tsx`，**5 类明确排除**。

> **2026-11-24 15:00 更新**：`TextButton` 已落地，15 处引用收编了 17 个文字按钮；裸 `<button>` 从 34 降到 19。会员「性别」已改用 `OptionChip`（并行修改）。剩余缺口 3 个。

---

## A. 已在 ui.tsx，保留为基础组件（12 类）

| 组件 | 出现 | 结论 | 库里的形态 |
| --- | --- | --- | --- |
| `Button` | 22 处 / 8 个文件 | 保留，唯一主/次按钮 | 4 变体（primary / secondary / warm / dark）× 2 尺寸；Figma 补 pressed / disabled / loading |
| `IconButton` `BackButton` | 4 处 + 1 处（另有 App 手写返回 1 处） | 保留；App 那处先换掉 | IconButton 5 变体；BackButton 只留「深色 / 图片上」 |
| `Stepper` `AddButton` | 2 处 + 1 处（另有 `DishAddButton` 手写同构） | 保留并合并 | 数量控件一个组件；AddButton 增加 labeled 变体（「選規格」） |
| `Tag` | 9 处 | 保留 | 8 tone × 2 密度；`DishTag` 是业务变体，不进库 |
| `OptionChip` `ChoiceRow` | 3 处 + 2 处（另有 2 处手写：会员性别、支付小费） | 保留并收编手写 | 全站只保留一套选中态 token；补 disabled |
| `InlineAlert` `StatusPanel` | 4 处 + 3 处 | 保留 | InlineAlert 4 tone；StatusPanel card / row 两形态 |
| `BottomSheet` | 8 处 / 4 个文件 | 保留 | 容器件：标题 + 关闭 + 滚动区 + footer |
| `Page` `Section` `ActionBar` | 5 + 27 + 4 处 | 保留，定义为「页面骨架」 | Figma 里是 pattern，不是普通组件；ActionBar 必须和 Page footer 绑定 |
| `Row` | 26 处 | 保留 | label / value，含 strong 态 |
| `Price` | 6 处 + 全站金额 | 保留 | `$` 常规字重、数字 tabular-nums |
| `Empty` + `EmptyArt` | 3 处 | 保留 | 空状态 |
| `TableIdentity` | 3 处 | 保留，标注「业务轻组件」 | 含桌台/人数文案，放 ui 是因为只依赖 lang，不要继续加业务字段 |

## B. 重复出现、但还没抽出来（收进 ui.tsx）

| 组件 | 现在的重复 | 数量 | 库里的形态 |
| --- | --- | --- | --- |
| `TextButton` ✅ | 订单详情、会员、支付、搜索取消、清空购物车、展开更多 | **17 个裸 `<button>` → 1 个组件** | 已落地：tone × size × weight × underline × compact |
| `TextInput` `Textarea` `Field` | 确认页 `Field`、会员 5 个输入 + 地区码、支付金额、2 个 textarea | 约 11 处 | 目前只有 `fieldClass` 字符串常量，设计库不能只有 class；需要 label / prefix / error / disabled |
| `SelectRow` | 支付方式、优惠券入口、会员「修改密码 / 退出」 | 3 处 | label + value + Chevron，和 ChoiceRow 共用状态 token |
| `SegmentedControl` | App 自写胶囊 vs 确认页用 OptionChip | 同一决策 2 种长相 | 堂食/外带只保留一种控件，这是不一致，不是缺组件 |

## C. 业务组件：放共享层，不进 ui.tsx

| 组件 | 位置 | 为什么 |
| --- | --- | --- |
| `DishCard` `DishPage` `SearchOverlay` `CartBar` `CartRow` | menu.tsx | 依赖 `Dish` / `CartLine`，只在菜单域 |
| `DishTag` | menu.tsx | 依赖 emoji 图标资源；硬编码 2 个 hex，应先改 token |
| `CategoryPill` | App.tsx | 菜单导航专用，搬到 menu.tsx；值是分类 id，不是通用状态 |
| `RoundGroup` + `ItemList` | orders.tsx | 确认页和订单页共用，抽到 `components/order/` |
| `FeeRows` | pricing.tsx | 金额规则组件，3 个页面共用 |
| `StoreCard` | store.tsx | 含门店数据和定位逻辑 |
| `MemberPage` | member.tsx | 完整页面，不是组件 |

## D. 明确不进库

| 项 | 原因 |
| --- | --- |
| `StatusBar` | 桌面预览用的假状态栏，产品里不存在 |
| `ThirdPartyPage` | 模拟第三方支付页，故意脱离设计系统 |
| `Welcome` 语言胶囊 | 全站只出现 1 次，不为它加变体 |
| 会员入口卡 / 桌台号块 | 页面私有，各 1 处 |
| `Offers` / `Logo` | **0 引用**。`Offers` 是没接线的优惠券面板，属功能缺口，不是组件问题 |

## E. 建库前先做的 3 件事

1. **清掉死代码**：`Offers`（优惠券面板不可达）、`Logo`。决定接不接，再接。
2. **合并重复 token**：`--color-warning` = `--color-pending`（同色同底）；`--radius-lg` = `--radius-card` = 16px。Figma 变量只留一套。
3. **补 4 个缺口件，先替换 17 个 TextButton**，再做 Figma 库。否则库会把「裸 button 写法」一起固化。

## F. Figma 文件结构建议

- **Foundations**：color / type / radius / spacing（与 `index.css` 的 `@theme` 一一对应）
- **Primitives**：A 组 12 类
- **Patterns**：Page + Section + ActionBar + BottomSheet + Empty
- **Business · Menu**：DishCard / DishPage / CartBar / CategoryPill
- **Business · Order**：RoundGroup / ItemList / FeeRows / StatusPanel 组合

## 附：当前裸 `<button>` 分布（34 个）

| 文件 | 数量 | 主要用途 |
| --- | --- | --- |
| App.tsx | 8 | 返回、堂食/外带、会员卡、桌台、搜索、分类、分类行 |
| menu.tsx | 5 | 卡片/列表打开、選規格 |
| pay.tsx | 2 | 小费 4 档、支付方式 |
| pricing.tsx | 3 | 优惠券入口、不使用、券卡片 |
| Welcome.tsx | 1 | 语言切换 |
| 合计 | 19 | 其余已由 `TextButton` 收编 |
