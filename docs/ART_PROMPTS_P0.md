# P0 提示词 — 地面/道路 4 张 + 装饰小物 14 张

> 逐条复制 Prompt 生成，保存为对应文件名（PNG）。
> 生成后不用抠图，白底直接发我即可。

---

## A. 地面/道路材质（4 张）

**通用要求**：正俯视（top-down）、无缝可平铺、纹理**铺满整个画面**（不要留白边、不要圆角、不要物体）、颜色明快呈卡通乐高感。我会把方形贴图转成游戏里的等距菱形地块，你只管出方形无缝图。

### 1. `ground_grass.png` — 草地 A
```
Seamless tileable top-down cartoon grass texture for a LEGO-style city building game, bright cheerful green (#7ec850), subtle clay-render bumps like soft plastic studs, smooth toy-like material, texture fills the entire square frame edge to edge, orthographic top-down view, no objects, no border, no text
```

### 2. `ground_grass2.png` — 草地 B（略深）
```
Seamless tileable top-down cartoon grass texture for a LEGO-style city building game, slightly darker green (#6db544) than a companion tile, subtle clay-render bumps like soft plastic studs, smooth toy-like material, texture fills the entire square frame edge to edge, orthographic top-down view, no objects, no border, no text
```

### 3. `road_tile.png` — 沥青路面（无标线！）
```
Seamless tileable top-down cartoon asphalt road texture for a toy city game, medium gray (#5a5a5a) smooth clay-like surface with very subtle speckle, absolutely no lane markings, no lines, no arrows, texture fills the entire square frame edge to edge, orthographic top-down view, no border, no text
```
⚠️ 千万不要画车道线——车道线由代码按道路拼接方向绘制，画了就会歪。

### 4. `road_crosswalk.png` — 十字路口斑马线
```
Seamless top-down cartoon road intersection tile for a toy city game, medium gray asphalt (#5a5a5a) with white zebra crosswalk stripes along all four edges of the square and a plain gray center, clean toy-like clay render, texture fills the entire square frame edge to edge, orthographic top-down view, no cars, no text
```

---

## B. 装饰小物（14 张）

**通用模板**（每条 Prompt 已内含，无需再拼）：Q 版 3D 黏土/软胶玩具质感、等距 3/4 视角、左上光源、纯白背景、无地面投影、无文字。物体都是放在 1×1 小格子上的小物件，造型要**圆润可爱、简洁**。

### 1. `deco_tree_big.png` — 大树
```
A single cute round fluffy tree, chibi 3D clay render, vinyl toy style, chubby bright green ball-shaped canopy on a short thick brown trunk, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 2. `deco_tree_pine.png` — 松树
```
A single cute pine tree, chibi 3D clay render, vinyl toy style, three stacked rounded dark-green cone layers on a short brown trunk, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 3. `deco_bush.png` — 灌木丛
```
A single cute low round bush with tiny pink and yellow flowers, chibi 3D clay render, vinyl toy style, plump green rounded shape, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 4. `deco_flowerbed.png` — 花坛
```
A small square flower bed with a low stone border filled with colorful tulips (red yellow pink), chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 5. `deco_rock.png` — 石头堆
```
A small cluster of three smooth rounded gray boulders of different sizes, chibi 3D clay render, vinyl toy style, soft matte plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 6. `deco_streetlight.png` — 路灯
```
A single cute street lamp, chibi 3D clay render, vinyl toy style, dark gray rounded pole with one warm yellow glowing round lamp head, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 7. `deco_bench.png` — 长椅
```
A single cute park bench, chibi 3D clay render, vinyl toy style, warm wooden slats with rounded dark green metal legs and armrests, smooth soft plastic texture, isometric 3/4 view facing lower-left, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 8. `deco_trashbin.png` — 垃圾桶
```
A single cute green public trash bin with a rounded lid and small recycling mark, chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 9. `deco_hydrant.png` — 消防栓
```
A single cute red fire hydrant, chibi 3D clay render, vinyl toy style, chubby rounded body with silver caps, smooth soft plastic texture, isometric 3/4 view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 10. `deco_fence.png` — 白围栏
```
A short section of cute white picket fence with rounded posts, chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 view angled like a diamond tile edge, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 11. `deco_pond.png` — 小水池
```
A small round pond with light blue glossy water, smooth stone rim and one tiny lily pad, chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 top-down view, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 12. `deco_bridge.png` — 小木桥
```
A tiny cute arched wooden footbridge with rounded rails, chibi 3D clay render, vinyl toy style, warm brown wood, smooth soft plastic texture, isometric 3/4 view facing lower-left, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```

### 13. `deco_billboard.png` — 广告牌
```
A single cute roadside billboard on two short legs, blank white board with rounded red frame, chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 view facing lower-left, soft studio light from upper left, centered on pure white background, no ground shadow, no text on the board
```

### 14. `deco_traffic_light.png` — 红绿灯
```
A single cute traffic light on a rounded dark pole, three glowing lights red yellow green, chibi 3D clay render, vinyl toy style, smooth soft plastic texture, isometric 3/4 view facing lower-left, soft studio light from upper left, centered on pure white background, no ground shadow, no text
```
