# P0 素材生成提示词（可直接复制粘贴）

> ⏸️ **2026-07-31 更新**：游戏已关闭「招募新居民」功能（固定 8 位家人，`CATALOG.RECRUIT_ENABLED = false`），
> 所以下面第 2 节的 **24 位居民角色暂缓生成** —— 提示词全部保留，后期开启招募时直接用。
> **现在只需要做第 1 节的 4 张地面材质**，做完接着做 P1 的 21 台车辆 + 8 顶帽子（要提示词跟我说）。

> 生成日期：2026-07-31 ｜ 对应清单：`docs/ART_ASSETS.md` 第 1、2 节
> **风格基准**：已交付的 8 位家人（`char_mom` / `char_grandpa` …）和 45 栋建筑。
> 经比对确认，现有风格是 **Q 版 3D 软胶玩偶（chibi vinyl toy / smooth clay render）**，不是乐高小人 —— 提示词已按真实风格编写，请勿改成 "LEGO minifigure"，否则会和现有素材割裂。

---

## 📦 交付方式（重要）

1. 每个素材**一张独立 PNG**，文件名严格用本文档的 `文件名` 列（小写 + 下划线 + `.png`）。
2. 生成完打包成一个 zip：`art_p0_2026-07-31.zip`（zip 里直接放 PNG，不要再套子文件夹）。
3. 交给我的两种方式任选：
   - 上传到对话里发给我；
   - 或放到 AI Drive 根目录（我会去 `/mnt/aidrive` 取）。
4. 我接手后做：抠残留底 → 裁透明边 → 统一缩放 → 转 WebP 压缩 → 落到 `public/static/assets/` → 跑 `npm run assets:index` → 游戏自动换成贴图。
5. **不用一次交齐**，交多少我接多少（清单里没有的 id 会自动回退 emoji，不会报错）。

### ✅ 自检 3 条（最容易出错的）
- [ ] 背景**纯透明**，没有白底 / 灰格子被压进图里 / 没有边框和文字水印
- [ ] **没有画地面投影阴影**（引擎会自动画椭圆影子，图里再带一个会变成"双影子"）
- [ ] 人物 / 车辆朝向**左下方**（朝右走时引擎自动水平镜像，所以只需要朝左的那一版）

---

## 🎨 通用提示词前后缀

### 角色通用（24 张都要带）

**前缀（放在描述前）**
```
Chibi 3D vinyl toy figure, smooth clay render, kid-friendly cute cartoon style, no outlines, soft studio lighting from the upper-left, large rounded head with head-to-body ratio about 1:2.5, simple friendly face with dot eyes and a warm smile, standing upright with legs together in a relaxed idle pose, three-quarter view turned toward the lower-left, full body visible from head to shoes,
```

**后缀（放在描述后）**
```
, fully transparent background, no ground shadow, no floor, no base plate, no props other than described, no text, no logo, no watermark, subject centered and bottom-aligned with minimal empty padding, clean product render, high resolution
```

> 组合方式：`前缀` + `本表的造型描述` + `后缀`

### 地面砖通用（4 张都要带）

**前缀**
```
Isometric single diamond-shaped ground tile, smooth clay render toy-diorama style, soft lighting from the upper-left, the diamond fills the frame so its four corners touch the midpoints of the four image edges, 2:1 width-to-height diamond,
```

**后缀**
```
, everything outside the diamond is fully transparent, seamlessly tileable, top-down isometric material only, no buildings, no trees, no people, no vehicles, no arrows, no text, no watermark, no drop shadow, image size 1024x512
```

---

## 1️⃣ ⭐ 现在就做：地面砖（4 张，性价比最高）

尺寸：**1024 × 512**

| 文件名 | 中文说明 | 造型描述（拼进通用前后缀） |
|--------|----------|------|
| `ground_grass.png` | 草地（浅） | `bright fresh green grass lawn surface with a soft short-grass texture and very subtle rounded bumps, cheerful saturated toy green` |
| `ground_grass2.png` | 草地（深一档，交替铺出棋盘感） | `the same green grass lawn surface but one shade darker and slightly cooler in tone, so it can alternate with the lighter tile in a checkerboard pattern, identical texture and edge treatment` |
| `road_tile.png` | 柏油路面（**不要标线**） | `dark grey smooth asphalt road surface with a light grey rounded concrete curb along the edges, clean and matte, absolutely no road markings, no lines, no dashes, no arrows` |
| `road_crosswalk.png` | 斑马线 | `dark grey asphalt road surface with a set of thick white zebra-crossing stripes painted on it, the stripes run parallel to the lower-left to upper-right diagonal of the diamond, evenly spaced, slightly worn paint` |

> ⚠️ `road_tile` 千万不要画任何标线/箭头/虚线 —— 转弯和路口的标线是引擎按邻接关系实时画的，图里自带标线会在拐角处歪掉。

---

## 2️⃣ ⏸️ 暂缓（提示词保留，后期开启招募再做）：居民角色（24 张）

尺寸：高 ≥ 1024px；朝向左下；站姿双腿并拢。
参照已交付的 `char_mom` / `char_grandpa`：Q 版软胶玩偶、无描边、柔光、脸部只有点眼 + 微笑。

| # | 文件名 | 游戏内角色 | 造型描述（拼进通用前后缀） |
|---|--------|-----------|------|
| 1 | `char_baker_wang.png` | 👨‍🍳 面包店王叔叔 | `a friendly middle-aged male baker wearing a white double-breasted chef jacket, a tall white chef hat, a beige apron, holding a golden baguette in one hand, short black hair, rosy cheeks` |
| 2 | `char_doctor_li.png` | 👩‍⚕️ 医生李阿姨 | `a kind young female doctor in a crisp white lab coat over light blue scrubs, a stethoscope around her neck, black hair tied in a ponytail, holding a small clipboard` |
| 3 | `char_police_zhang.png` | 👮 警察张叔叔 | `a cheerful male police officer in a navy blue police uniform with silver buttons and shoulder badges, a navy peaked police cap, a walkie-talkie clipped to his chest, black belt` |
| 4 | `char_teacher_liu.png` | 👩‍🏫 老师刘阿姨 | `a warm female school teacher in a soft coral knee-length dress with a cardigan, round glasses, shoulder-length black hair, holding a closed textbook against her chest` |
| 5 | `char_driver_zhao.png` | 🧔 司机赵师傅 | `a sturdy male bus driver in a dark blue jacket uniform with a light blue shirt and tie, a flat driver cap, a short beard, holding a small steering wheel in one hand` |
| 6 | `char_painter_zhou.png` | 🧑‍🎨 画家小周 | `a young male artist in a white shirt and a paint-splattered denim apron, a mustard yellow beret, holding a wooden palette in one hand and a paintbrush in the other, colorful paint smudges` |
| 7 | `char_engineer_chen.png` | 👷 工程师陈叔叔 | `a confident male construction engineer in an orange high-visibility work jumpsuit with reflective grey stripes, a yellow hard hat, holding a rolled blueprint under one arm` |
| 8 | `char_pilot_gao.png` | 🧑‍✈️ 飞行员高叔叔 | `a smart male airline pilot in a crisp white short-sleeve pilot shirt with gold shoulder epaulettes, a black tie, dark navy trousers, a black captain peaked cap with gold emblem` |
| 9 | `char_chef_sun.png` | 🧑‍🍳 厨师孙师傅 | `a jolly slightly chubby male chef in a white double-breasted chef coat with a red neckerchief, a very tall pleated chef hat, holding a metal frying spatula, small mustache` |
| 10 | `char_scientist_wu.png` | 🧑‍🔬 科学家吴博士 | `a curious male scientist in a white lab coat over a light grey shirt, clear safety goggles pushed up on his forehead, holding a glass test tube with glowing blue liquid, messy dark hair` |
| 11 | `char_postman_ma.png` | 🧑‍💼 邮递员小马 | `a energetic young male mail carrier in a green postal uniform with short sleeves and a green cap, a big brown leather satchel across his shoulder, holding a white envelope` |
| 12 | `char_gardener_yang.png` | 🧓 园丁老杨 | `a gentle elderly male gardener in a green gardening apron over a checked shirt, a wide straw sun hat, gardening gloves, holding a small green watering can, grey hair and kind wrinkles` |
| 13 | `char_firefighter_zheng.png` | 🧑‍🚒 消防员郑叔叔 | `a brave male firefighter in a dark navy firefighting jacket with bright yellow reflective stripes, a red firefighter helmet, thick gloves and heavy boots, oxygen mask hanging on his chest` |
| 14 | `char_vet_lin.png` | 🧑‍⚕️ 兽医小林 | `a sweet young female veterinarian in light blue surgical scrubs with a stethoscope, holding a tiny happy puppy in her arms, hair in a short bob, small paw-print badge` |
| 15 | `char_singer_annie.png` | 👩‍🎤 音乐家安妮 | `a lively young female singer in a sparkling purple sequined stage outfit with a short skirt and boots, wavy long hair, holding a silver microphone up near her mouth` |
| 16 | `char_athlete_dali.png` | 🏃 运动员大力 | `a fit young male athlete in a red sleeveless running singlet with a white race number bib, black running shorts, white running shoes, a sweatband on his forehead` |
| 17 | `char_pastry_xiaorou.png` | 🧁 甜品师小柔 | `a cute young female pastry chef in a pink apron over a white blouse with puffy short sleeves, a small pink chef hat, holding a tray with one frosted cupcake, hair in twin buns` |
| 18 | `char_photographer_akai.png` | 📷 摄影师阿凯 | `a casual young male photographer in a khaki multi-pocket photo vest over a white tee, a black DSLR camera hanging from his neck strap, a backwards cap, jeans and sneakers` |
| 19 | `char_astronaut_tianyi.png` | 🧑‍🚀 宇航员天翼 | `a proud astronaut in a puffy white spacesuit with blue trim and a chest control panel, holding the round glass space helmet tucked under one arm, short black hair visible` |
| 20 | `char_captain_laohai.png` | ⚓ 船长老海 | `a hearty elderly ship captain in a navy blue double-breasted captain coat with gold buttons, a white captain hat with a gold anchor emblem, a full white beard, holding a brass telescope` |
| 21 | `char_magician_qiqi.png` | 🎩 魔术师奇奇 | `a playful young magician in a black tuxedo with a red bow tie and a red-lined black cape, a tall black top hat, holding a slim magic wand with a white tip, one hand raised in a flourish` |
| 22 | `char_farmer_fubo.png` | 🌾 农场主福伯 | `a warm-hearted middle-aged male farmer in a red plaid shirt with blue denim overalls, a straw hat, brown work boots, carrying a small bundle of golden wheat under one arm` |
| 23 | `char_coder_xiaoji.png` | 💻 程序员小极 | `a relaxed young male programmer in a grey hoodie and dark jeans, black-framed glasses, holding an open silver laptop in one arm and a takeaway coffee cup in the other hand, slightly messy hair` |
| 24 | `char_coach_qiangge.png` | 🏀 篮球教练强哥 | `a energetic male basketball coach in a navy tracksuit jacket with white stripes and shorts, a whistle on a red lanyard around his neck, holding an orange basketball on his hip, short buzz cut` |

---

## 📋 打包前对照表

**现在需要的 4 个（P0）**
```
ground_grass.png
ground_grass2.png
road_tile.png
road_crosswalk.png
```

**暂缓的 24 个（保留备用，后期开启招募再做）**
```
char_baker_wang.png
char_doctor_li.png
char_police_zhang.png
char_teacher_liu.png
char_driver_zhao.png
char_painter_zhou.png
char_engineer_chen.png
char_pilot_gao.png
char_chef_sun.png
char_scientist_wu.png
char_postman_ma.png
char_gardener_yang.png
char_firefighter_zheng.png
char_vet_lin.png
char_singer_annie.png
char_athlete_dali.png
char_pastry_xiaorou.png
char_photographer_akai.png
char_astronaut_tianyi.png
char_captain_laohai.png
char_magician_qiqi.png
char_farmer_fubo.png
char_coder_xiaoji.png
char_coach_qiangge.png
```

---

## 🔜 做完 P0 之后

下一批（P1，29 张）提示词我会同样整理成 `docs/ART_PROMPTS_P1.md`：
- 21 台车辆（12 轿车 + 9 工程/服务车），车头朝左下 45°
- 8 顶帽子道具（正面平视、无人物）

需要提前拿 P1 提示词的话跟我说，我随时补上。
