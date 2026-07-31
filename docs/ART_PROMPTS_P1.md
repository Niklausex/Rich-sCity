# P1 素材生成提示词：车辆 47 张 + 帽子 8 张 + 树木装饰 14 张

> 生成日期：2026-07-31 ｜ 风格基准同 P0：**Q 版 3D 软胶玩偶 / 黏土微缩景观**（chibi vinyl toy, smooth clay render），
> 光源左上、透明背景、不画地面投影、底部贴边居中、一个 id 一张图。
> 交付：打包 `art_p1_2026-07-31.zip` 发我（PNG 直接放根层）。分批交也行，交多少接多少。

## 🥇 建议出图顺序

| 批次 | 内容 | 张数 | 说明 |
|------|------|------|------|
| 第 1 批 | 汽车 12 + 工程服务车 9 | **21** | 游戏里在路上跑、车库里展示，最显眼 |
| 第 2 批 | 树木装饰 `deco_*` | **14** | 空地目前是纯草地，加了树立刻"有城市味" |
| 第 3 批 | 帽子 `hat_*` | **8** | 小人头顶 + 商店 + 头像三处都用 |
| 第 4 批 | 火车 5 / 飞机 6 / 轮船 5 / 火箭 2 | **18** | 要先建火车站/机场/港口/发射台才解锁，可稍后 |

---

# 一、车辆（47 张，前缀 `veh_`）

## 🚗 车辆通用提示词

**前缀**
```
Isometric 3D chibi toy vehicle, smooth clay render, kid-friendly cute cartoon style, no outlines, soft studio lighting from the upper-left, slightly chunky rounded toy proportions with clearly recognizable real-world silhouette, three-quarter isometric view from the upper-left at about 30 degrees elevation, the front of the vehicle points toward the lower-left so the front and the left side are both visible,
```

**后缀**
```
, fully transparent background, no ground shadow, no floor, no road, no scenery, no people, no brand logo, no badge text, no license plate text, no text, no watermark, subject centered and bottom-aligned with minimal empty padding, clean product render, high resolution, at least 1024px wide
```

> ⚠️ 三条注意
> 1. **车头一律朝左下**（和角色同朝向）——引擎会在车往右开时自动水平镜像，只需要朝左这一版。
> 2. **不要画车标 logo 和车牌文字**（规避商标风险），只保留车灯/格栅/车身线条这些造型特征。
> 3. 飞机、轮船、火箭同样"机头/船头/箭头朝左下"，保持全套素材朝向一致。

## 1.1 汽车（12 张，第 1 批）

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_wuling.png` | 五菱宏光MINI EV | a tiny two-door micro electric city car, very short boxy body, big round headlights, light mint green paint, chunky little wheels |
| `veh_mini.png` | MINI Cooper | a classic small British hatchback, short bumpers, round headlights, white roof over British racing green body, black wheel arches |
| `veh_corolla.png` | 丰田卡罗拉 | a friendly family sedan, four doors, gentle sloping hood, slim swept headlights, silver-grey paint |
| `veh_su7.png` | 小米SU7 | a sleek modern electric sports sedan, very low smooth fastback roofline, thin light bar across the nose, glossy pearl blue paint, aero wheels |
| `veh_model3.png` | 特斯拉 Model 3 | a minimalist electric sedan, smooth grille-less rounded nose, big glass roof, matte white paint, simple silver aero wheels |
| `veh_byd_han.png` | 比亚迪·汉 | an elegant Chinese luxury electric sedan, wide chrome-trimmed nose, long light strip, deep pearl red paint, chrome window trim |
| `veh_gclass.png` | 奔驰大G(G63) | a boxy square off-road SUV, upright flat windshield, round headlights, exposed door hinges, spare wheel on the back door, matte black paint |
| `veh_landcruiser.png` | 丰田兰德酷路泽 | a big rugged full-size off-road SUV, tall chrome grille, roof rack, mud-terrain tires, sand beige paint |
| `veh_cybertruck.png` | 特斯拉Cybertruck | an angular stainless-steel electric pickup truck made of flat triangular panels, single light bar across the front, bare metal silver finish, no curves |
| `veh_gt3rs.png` | 保时捷911 GT3 RS | a low wide track-focused sports coupe, round headlights, sloping rear, huge tall rear wing, white paint with red accents, wide slick tires |
| `veh_lafa.png` | 法拉利 LaFerrari | a dramatic low-slung Italian hypercar, sharp pointed nose, scissor-style doors, sculpted side air intakes, glossy bright red paint |
| `veh_chiron.png` | 布加迪Chiron | a wide muscular hypercar, horseshoe front grille, C-shaped side line, two-tone dark blue and light blue paint, quad tailpipes |

## 1.2 工程 / 服务车（9 张，第 1 批）

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_taxi.png` | 出租车 | a cheerful city taxi sedan, bright yellow-green two-tone paint, small illuminated TAXI sign box on the roof (no letters), checkered stripe |
| `veh_bus.png` | 城市公交车 | a friendly city bus, long rounded body, large side windows, folding front door, blue and white paint, destination screen above the windshield (blank) |
| `veh_schoolbus.png` | 美式校车 | a classic American school bus, bright yellow body with black trim stripes, flat snout hood, stop-sign arm folded on the side, red warning lights on the roof |
| `veh_police_car.png` | 警车 | a police patrol sedan, white body with blue and black side panels, red-and-blue light bar on the roof, push bar on the front bumper |
| `veh_ambulance.png` | 救护车 | a boxy ambulance van, white body with a red cross emblem and red stripe, blue flashing lights on the roof, rear double doors |
| `veh_firetruck.png` | 消防云梯车 | a big red fire engine with a folded white aerial ladder on top, chrome hose reels and roller shutters on the sides, blue light bar |
| `veh_garbage.png` | 垃圾清运车 | a green garbage collection truck, rear loading hopper, hydraulic arms, amber beacon on the cab roof, chunky utility look |
| `veh_excavator.png` | 挖掘机 | a yellow tracked excavator, rotating cab, articulated boom and bucket resting on the ground, black rubber tracks, hydraulic cylinders |
| `veh_tractor.png` | 拖拉机 | a cheerful farm tractor, green body with yellow wheel rims, small front wheels and huge rear wheels, vertical exhaust pipe, open cab with roof canopy |

## 1.3 火车（5 张，第 4 批）

> 火车比较长，允许画面更宽（建议 1536×1024），保持车头朝左下的斜侧视角，能看到车头 + 一到两节车厢。

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_steam.png` | 蒸汽小火车 | a cute vintage steam locomotive with a tall black chimney puffing a small white steam puff, red wheels with connecting rods, brass details, one small coal tender behind |
| `veh_green_train.png` | 绿皮火车 | a retro Chinese passenger train, dark green carriages with a yellow horizontal stripe, blunt rounded diesel locomotive nose, small square windows |
| `veh_harmony.png` | 和谐号CRH380A | a white high-speed bullet train with a long streamlined pointed nose and a blue stripe along the windows, smooth aerodynamic body |
| `veh_fuxing.png` | 复兴号CR400AF | a modern white high-speed train with a sleek sharp nose and bold red stripe along the side, sealed inter-carriage design |
| `veh_maglev.png` | 上海磁悬浮 | a futuristic maglev train, wide flat wedge-shaped nose, white and blue livery, floating slightly above a short section of concrete guideway |

## 1.4 飞机（6 张，第 4 批）

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_balloon.png` | 热气球 | a cheerful hot air balloon, colorful rainbow striped envelope, woven wicker basket with rope lines, small burner, floating gently |
| `veh_helicopter.png` | 直升机 | a chunky utility helicopter, olive-grey fuselage, glass cockpit bubble, five-blade main rotor on top, tail rotor, skid landing gear |
| `veh_c919.png` | 国产大飞机C919 | a modern narrow-body airliner, white fuselage with a green and blue tail stripe, two underwing turbofan engines, upturned wingtips, landing gear down |
| `veh_b747.png` | 波音747 | a classic four-engine jumbo jet with the distinctive humped upper deck at the front, white and light blue livery, tall tail fin |
| `veh_a380.png` | 空客A380 | a huge double-deck airliner, very wide white fuselage with two rows of windows, four engines, enormous wings, sky blue tail accents |
| `veh_y20.png` | 运-20运输机 | a chubby military transport aircraft, high-mounted wings, four turbofans, T-tail, grey-blue camouflage paint, big multi-wheel landing gear |

## 1.5 轮船（5 张，第 4 批）

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_sailboat.png` | 帆船 | a small cheerful sailboat, white hull with a blue stripe, one tall mast with a big white triangular sail and a small red jib |
| `veh_speedboat.png` | 快艇 | a sleek little speedboat, white hull with red racing stripes, low windshield, outboard motor at the back, tiny white spray at the bow |
| `veh_xuelong.png` | 破冰船 | a sturdy polar research icebreaker, bright red hull with white superstructure, reinforced bow, helicopter deck at the back, cranes |
| `veh_cruise.png` | 大型邮轮 | a giant luxury cruise ship, tall white multi-deck superstructure with many balconies, dark blue hull, funnel on top, water slides on the top deck |
| `veh_liaoning.png` | 航空母舰 | a large aircraft carrier, flat grey flight deck with a ski-jump ramp at the bow, island bridge tower with radar masts on the right side, a few tiny toy jets parked |

## 1.6 火箭（2 张，第 4 批）

> 火箭是竖直的，请用 **竖版画布**（建议 1024×1536），底部贴边。

| 文件名 | 车型 | 造型描述 |
|--------|------|----------|
| `veh_cz5.png` | 长征五号火箭 | a tall white heavy-lift rocket standing upright, four blue side boosters strapped around the white core stage, black nose fairing tip, red flag-like accent stripe (no text) |
| `veh_shenzhou.png` | 神舟飞船 | a cute spacecraft capsule with a cone-shaped crew module, cylindrical service module, two rectangular blue solar panels spread out like wings, gold foil details |

---

# 二、树木与地图装饰（14 张，前缀 `deco_`，第 2 批）

## 🌳 装饰通用提示词

**前缀**
```
Isometric 3D chibi toy diorama prop, smooth clay render, kid-friendly cute cartoon style, no outlines, soft lighting from the upper-left, three-quarter isometric view from the upper-left at about 30 degrees elevation, a single small object sized to sit on one square tile of a toy city map,
```

**后缀**
```
, fully transparent background, no ground shadow, no base plate, no grass patch under it, no other objects, no text, no watermark, subject centered and bottom-aligned with minimal empty padding, clean product render, at least 768px
```

> ⚠️ **不要在物体下面画一块草地或底座**——引擎会把它直接放在草地格子上，自带底座会露出接缝。

| 文件名 | 中文 | 造型描述 |
|--------|------|----------|
| `deco_tree_big.png` | 大树 | a chubby broadleaf tree with a short thick brown trunk and one big rounded fluffy green canopy, slightly darker green on the lower right side |
| `deco_tree_pine.png` | 松树 | a cute conifer pine tree made of three stacked cone-shaped dark green tiers, short straight brown trunk |
| `deco_bush.png` | 灌木丛 | a small rounded green shrub cluster of two or three lumps, dotted with a few tiny white and pink flowers |
| `deco_flowerbed.png` | 花坛 | a small square flower bed with a low beige brick border, filled with soil and colorful tulips in red, yellow and pink |
| `deco_rock.png` | 石头堆 | a small pile of three smooth grey boulders of different sizes, subtle speckled stone texture, a tiny tuft of grass at the base |
| `deco_streetlight.png` | 路灯 | a single city street lamp, dark grey slim pole with a gently curved arm and a warm yellow glowing lamp head, small round base |
| `deco_bench.png` | 长椅 | a small park bench, warm wooden slats for seat and backrest, black cast-iron legs and armrests |
| `deco_trashbin.png` | 垃圾桶 | a cute public trash bin, dark green cylindrical body with a lighter lid and a small recycling symbol, slightly chunky toy proportions |
| `deco_hydrant.png` | 消防栓 | a classic bright red fire hydrant with two side valve caps, a domed top bolt and a small round base flange |
| `deco_fence.png` | 围栏 | one straight section of white picket fence, about five pointed vertical planks with two horizontal rails, clean painted wood |
| `deco_pond.png` | 小水池 | a small round garden pond, calm light blue water surface with a couple of lily pads, ringed by grey stones, water sitting flush with the ground |
| `deco_bridge.png` | 小桥 | one short flat wooden footbridge span, warm brown planks with simple side railings, ends cut flat so it can tile with the next piece |
| `deco_billboard.png` | 广告牌 | a small blank billboard, clean empty white panel in a red frame on two grey support posts, absolutely no text or picture on the panel |
| `deco_traffic_light.png` | 红绿灯 | a cute traffic light on a dark grey pole, one vertical black housing with glowing red, yellow and green round lamps, small square base |

---

# 三、帽子（8 张，前缀 `hat_`，第 3 批）

## 🎩 帽子通用提示词

**前缀**
```
A single 3D chibi toy hat as a standalone prop, smooth clay render, kid-friendly cute cartoon style, no outlines, soft lighting from the upper-left, viewed slightly from the front-above at a gentle three-quarter angle with the opening of the hat facing straight down so it can be placed on top of a character's head,
```

**后缀**
```
, no head, no face, no hair, no mannequin, no person, fully transparent background, no ground shadow, no base, no text, no watermark, hat centered in frame with minimal empty padding, clean product render, image size 512x512
```

| 文件名 | 中文 | 造型描述 |
|--------|------|----------|
| `hat_cap.png` | 棒球帽 | a red baseball cap with a curved navy brim and a small button on top, slight fabric seams |
| `hat_top.png` | 绅士礼帽 | a tall black gentleman's top hat with a glossy black satin band and a flat brim |
| `hat_cowboy.png` | 牛仔帽 | a brown leather cowboy hat with a creased crown, upturned wide brim and a woven leather band |
| `hat_crown.png` | 国王皇冠 | a golden king's crown with five rounded points tipped with pearls, red velvet inner lining, three colorful gemstones on the band |
| `hat_grad.png` | 博士帽 | a black graduation mortarboard cap with a flat square top and a golden tassel hanging over one corner |
| `hat_helmet.png` | 工程安全帽 | a bright yellow construction hard hat with ridged crown ribs and a short front brim, thin white chin strap |
| `hat_party.png` | 派对帽 | a cone-shaped party hat with colorful rainbow zigzag stripes, small pom-pom on the tip and an elastic string |
| `hat_santa.png` | 圣诞帽 | a red Santa hat with a soft white fluffy fur trim at the base and a big white pom-pom on the drooping tip |

---

## 📋 打包对照表

**第 1 批 · 汽车 + 工程服务车（21）**
```
veh_wuling.png      veh_mini.png        veh_corolla.png     veh_su7.png
veh_model3.png      veh_byd_han.png     veh_gclass.png      veh_landcruiser.png
veh_cybertruck.png  veh_gt3rs.png       veh_lafa.png        veh_chiron.png
veh_taxi.png        veh_bus.png         veh_schoolbus.png   veh_police_car.png
veh_ambulance.png   veh_firetruck.png   veh_garbage.png     veh_excavator.png
veh_tractor.png
```

**第 2 批 · 树木装饰（14）**
```
deco_tree_big.png   deco_tree_pine.png  deco_bush.png       deco_flowerbed.png
deco_rock.png       deco_streetlight.png deco_bench.png     deco_trashbin.png
deco_hydrant.png    deco_fence.png      deco_pond.png       deco_bridge.png
deco_billboard.png  deco_traffic_light.png
```

**第 3 批 · 帽子（8）**
```
hat_cap.png    hat_top.png     hat_cowboy.png  hat_crown.png
hat_grad.png   hat_helmet.png  hat_party.png   hat_santa.png
```

**第 4 批 · 火车/飞机/轮船/火箭（18）**
```
veh_steam.png     veh_green_train.png veh_harmony.png   veh_fuxing.png    veh_maglev.png
veh_balloon.png   veh_helicopter.png  veh_c919.png      veh_b747.png      veh_a380.png     veh_y20.png
veh_sailboat.png  veh_speedboat.png   veh_xuelong.png   veh_cruise.png    veh_liaoning.png
veh_cz5.png       veh_shenzhou.png
```

## ✅ 自检 4 条
- [ ] 背景纯透明，没有白底 / 灰白棋盘格 / 边框 / 文字水印
- [ ] **没有地面投影阴影、没有底座、没有草地块**（引擎自己画影子和地面）
- [ ] 车头 / 机头 / 船头 **朝左下**（往右开时引擎自动镜像）
- [ ] 帽子是**单独一顶**，没有头、没有脸、没有模特

> ✅ 引擎侧已就位：建造面板新增 **🌳装饰** 页签，14 个装饰已可建造（1×1 格，8~30 元，带少量幸福度）。
> 现在没有贴图时用大 emoji 顶着，你的 PNG 一交付就自动替换成贴图，无需改任何代码。
