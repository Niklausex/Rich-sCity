# 美术素材收件箱

提示词清单：
- 地面材质 4 张（当前优先）→ [`../docs/ART_PROMPTS_P0.md`](../docs/ART_PROMPTS_P0.md)
- 车辆 47 / 树木装饰 14 / 帽子 8 → [`../docs/ART_PROMPTS_P1.md`](../docs/ART_PROMPTS_P1.md)
- 全量需求（125 张）→ [`../docs/ART_ASSETS.md`](../docs/ART_ASSETS.md)

把新生成的 PNG（透明背景）打包成 zip 发我，或直接放进这个目录 / AI Drive。
文件名严格按清单里的 id 命名，例如：

```
art_inbox/char_baker_wang.png
art_inbox/veh_wuling.png
art_inbox/ground_grass.png
```

我（AI）接手后会做：抠残留底 → 裁透明边 → 缩放 → 转 WebP → 落到 `public/static/assets/`
→ 执行 `npm run assets:index` 生成 manifest → 游戏自动切换成贴图（无需改代码）。

原始 PNG 不入 git（体积大），只有压缩后的 WebP 会提交。
