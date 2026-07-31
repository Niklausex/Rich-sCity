# 美术素材收件箱

提示词清单（以这套为准，全部与代码 ID 核对过）：
- **P0（最优先）**：地面/道路 4 张 + 装饰小物 14 张 → [`../docs/ART_PROMPTS_P0.md`](../docs/ART_PROMPTS_P0.md)
- **P1**：车辆 39 张 → [`../docs/ART_PROMPTS_P1.md`](../docs/ART_PROMPTS_P1.md)
- **P2**：帽子 8 张 + 招募居民 24 张(暂缓) → [`../docs/ART_PROMPTS_P2.md`](../docs/ART_PROMPTS_P2.md)
- 全量需求总表 → [`../docs/ART_ASSETS.md`](../docs/ART_ASSETS.md)

把生成的 PNG（白底即可，不用抠图）打包 zip 发我，或直接放进这个目录 / AI Drive。
文件名严格按清单里的 id 命名，例如：

```
art_inbox/deco_tree_big.png
art_inbox/veh_wuling.png
art_inbox/ground_grass.png
```

我（AI）接手后会做：抠图 → 裁透明边 → 缩放 →（地面图转等距菱形）→ 转 WebP
→ 落到 `public/static/assets/` → `npm run assets:index` 生成 manifest
→ 游戏自动切换成贴图（无需改代码）。

原始 PNG 不入 git（体积大），只有压缩后的 WebP 会提交。
