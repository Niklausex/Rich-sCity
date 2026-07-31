# Rich's City 美术素材需求总表（第二批）

> 本文档为**唯一权威清单**，所有 ID 与游戏代码一一对应，文件名错一个字母游戏就认不出来。
> 提示词文档：
> - **[ART_PROMPTS_P0.md](ART_PROMPTS_P0.md)** — 地面/道路 4 张 + 装饰小物 14 张（最优先）
> - **[ART_PROMPTS_P1.md](ART_PROMPTS_P1.md)** — 车辆 39 张
> - **[ART_PROMPTS_P2.md](ART_PROMPTS_P2.md)** — 帽子 8 张 + 招募居民 24 张（居民暂缓）

---

## 一、风格基准（必须和第一批一致）

第一批已交付 53 张（45 建筑 + 8 家人），风格基准以它们为准：

| 要素 | 要求 |
|---|---|
| 整体风格 | Q 版 3D 软胶玩偶 / 黏土微缩模型（chibi 3D clay render, cute vinyl toy miniature） |
| 质感 | 光滑软塑料/黏土质感，圆润边角，微微高光 |
| 光源 | 柔和影棚光，**光源在左上方** |
| 背景 | **纯白背景**（我用白底抠图管线处理，务必纯白、干净） |
| 阴影 | **不要地面投影/落影**（有影子会导致抠图边缘发脏） |
| 构图 | 单个物体居中，四周留 10% 左右空白，画面里**不要文字/水印** |
| 尺寸 | 1024×1024 或模型默认即可，我会统一压缩转 WebP |

## 二、视角规范（按类别不同，很重要）

| 类别 | 视角 |
|---|---|
| 装饰小物（deco_*） | 与建筑一致：等距 3/4 俯视视角（isometric 3/4 view, viewed from upper-left） |
| 车辆（veh_*） | **3/4 侧视，车头朝向左下方**（游戏里往右开会自动镜像，所以底图必须朝左） |
| 帽子（hat_*） | 3/4 视角、朝左下方（和角色朝向一致），只画帽子本体 |
| 招募居民（char_*） | 与 8 位家人完全一致：全身站姿、3/4 侧身**面朝左下方** |
| 地面材质（ground_* / road_*） | **正俯视（top-down）无缝贴图**，我负责转成菱形地块 |

## 三、命名与交付流程

1. 文件名 = 下表 ID + `.png`，例如 `veh_wuling.png`、`deco_tree_big.png`
2. 全部 PNG 打包 zip 发我（或放 AI Drive / `art_inbox/`），白底即可，不用自己抠图
3. 我接手：抠图 → 裁边 → 缩放 → WebP → `npm run assets:index` 生成 manifest → **游戏自动换贴图，不用改代码**
4. 可以分批交付，缺的素材游戏会自动回退 emoji/代码绘制，不报错

---

## 四、全量清单（65 张 + 暂缓 24 张）

### P0-A 地面/道路（4 张）★★★ 最优先，全屏可见

| 文件名 | 内容 |
|---|---|
| ground_grass | 草地无缝贴图 A（主色） |
| ground_grass2 | 草地无缝贴图 B（略深，棋盘格交替用） |
| road_tile | 灰色沥青路面无缝贴图（**不要画车道线**，标线由代码绘制保证拼接方向正确） |
| road_crosswalk | 十字路口地块：四边带白色斑马线 |

### P0-B 装饰小物（14 张）★★★

| 文件名 | 名称 | 文件名 | 名称 |
|---|---|---|---|
| deco_tree_big | 大树 | deco_bench | 长椅 |
| deco_tree_pine | 松树 | deco_trashbin | 垃圾桶 |
| deco_bush | 灌木丛 | deco_hydrant | 消防栓 |
| deco_flowerbed | 花坛 | deco_fence | 白围栏 |
| deco_rock | 石头堆 | deco_pond | 小水池 |
| deco_streetlight | 路灯 | deco_bridge | 小木桥 |
| deco_billboard | 广告牌 | deco_traffic_light | 红绿灯 |

### P1 车辆（39 张）★★

汽车 12 / 工程服务车 9 / 火车 5 / 飞机 6 / 轮船 5 / 火箭 2，完整列表见 [ART_PROMPTS_P1.md](ART_PROMPTS_P1.md)。
文件名规则：`veh_` + 车辆 ID，例如 `veh_wuling`、`veh_fuxing`、`veh_c919`。

### P2-A 帽子（8 张）★

| 文件名 | 名称 | 文件名 | 名称 |
|---|---|---|---|
| hat_cap | 棒球帽 | hat_grad | 博士帽 |
| hat_top | 绅士礼帽 | hat_helmet | 工程安全帽 |
| hat_cowboy | 牛仔帽 | hat_party | 派对帽 |
| hat_crown | 国王皇冠 | hat_santa | 圣诞帽 |

### P2-B 招募居民（24 张）⏸️ 暂缓

招募功能本版本关闭，**先不用做**，清单保留在 [ART_PROMPTS_P2.md](ART_PROMPTS_P2.md) 里，开启功能时再生成。

---

## 五、已交付（第一批，53 张，无需重做）

45 座建筑（airport…zoo）+ 8 位家人（char_dad…char_brother），已抠图转 WebP 上线。
