# 技术交接文档（Agent Handoff）

> 目的：任何新接手的 Agent / 开发者，只读本文档 + README 即可完整理解项目现状、关键约定与待办。
> 最后更新：2026-08-01（main @ 7a0d70f）

---

## 1. 项目一句话

给三年级孩子做的教育向城市模拟经营游戏「Rich's City」：答题赚钱 → 建设城市 → 收税升级。名字里的"乐高"只是品牌叫法，**美术风格不是乐高质感**（见 §5 重要决策）。

## 2. 技术栈与运行

- Hono + TypeScript + Vite → Cloudflare Pages 架构；游戏本体是 `src/index.tsx` 输出的单页 + `public/static/js/` 下的原生 JS（无前端框架）
- 存档：纯 localStorage（键 `richs_city_save_v1`），**无后端数据库**
- 沙盒运行：
  ```bash
  cd /home/user/webapp
  npm run build          # = node tools/build-asset-manifest.mjs && vite build
  pm2 start ecosystem.config.cjs   # wrangler pages dev dist --ip 0.0.0.0 --port 3000
  curl http://localhost:3000       # 验证
  ```
- ⚠️ 改了 `public/static/` 下的文件也要重新 `npm run build`（静态文件会拷进 dist）
- 生产未部署；部署 Cloudflare Pages 前需先和用户确认部署路径（用户自己的 CF 账号 vs 平台托管）

## 3. 代码模块地图

| 文件 | 职责 |
|---|---|
| `src/index.tsx` | Hono 入口，输出 HTML 骨架 + 引 CDN（Tailwind）+ 静态 JS |
| `public/static/js/main.js` | 启动、主循环、事件绑定 |
| `public/static/js/engine/state.js` | 存档读写、存档迁移（含 v3.1 的 `POP_TO_INCOME` 老档兑换） |
| `public/static/js/engine/game.js` | 经济/税收/幸福度/解锁逻辑（`weeklyIncome()` / `peakIncome()` / `isUnlocked()` / `nextUnlock()`）+ **答题额度系统**：`DAILY_LIMIT=50`（每居民每日上限）、`SUBJECT_WEIGHTS`（英30/科25/通25/数12/语8）、`rollSubject()`、`askedCount/canAsk/refillQuestion`、`S.askedToday` 按居民计数（每天清零）；**已掌握/错题本**：`S.mastered`（答对题面，永久排除，连线题除外，上限5000）、`S.wrongPool`（答错题完整对象，上限200，答对移出）、`drawFor` 30%概率复习错题（`q.review=true`，`reshuffleQuestion` 重洗选项），抽新题排除 recent+mastered；questions.js 各静态库耗尽时返回 null 逐级回退到生成器（数学生成器带排除重试）；**v3.4 新增**：`qKey(q)`（听音/创作题用 `q.qkey` 去重）、`S.reviewQueue` 遗忘曲线（首次答对入队 {key,day,snap}，7天后 `drawFor` 20%概率巩固复习 `q.review='consolidate'`，再对→移出队列真掌握，答错→移出 mastered 重学并入错题本，上限500）、`drawFor` 语文35%概率出创作题（`S.createdToday<2`）、`submitWriting`（存 `S.writings` 上限200 + 恒定奖励）、`todayReading/markReadingDone/approveReading`（每日跟读 todo→pending→approved，审批发 20元+快乐5，`newDayQuestions` 按 `(day-1)%15` 轮播短文并清零 createdToday） |
| `public/static/js/data/catalog.js` | **唯一数据源**：59 建筑（含 14 装饰 deco_*）、39 车辆 VEHICLES、8 帽子 HATS、24 招募角色、`RECRUIT_ENABLED=false` |
| `public/static/js/data/questions-data.js` | 基础静态题库（语/英/科/通识，按年级 3~6 分层） |
| `public/static/js/data/questions-data2.js` | **扩容题库**：`ENGLISH_VOCAB` 分级词汇表 255 词 + 科学/通识/英语 ~208 道新静态题（末尾合并进 `QUESTION_BANK`） |
| `public/static/js/data/questions-data3.js` | **v3.4 课程包**：牛津树/YLE 词汇并入 ENGLISH_VOCAB（去重后 374 词：g3:89/g4:101/g5:96/g6:88）+ EXT2 静态题（英语阅读24/美式通识50/科技科学32/语感鉴赏28，mergeBank 按题面全局去重）+ `window.CREATIVE_PROMPTS`×16 + `window.READ_ALOUD`×15 |
| `public/static/js/data/questions.js` | 题目引擎：数学生成器（计算 + **LogicGen 逻辑思维11类**，选择题 60/40 分流）+ 英语词汇生成器（词→义/义→词/拼写辨析/单词连线/字母填空）+ **英语难度+1年级**（`g=min(g+1,6)`）+ `genListenChoice` 听音选词（`q.say`+`qkey='listen:'+word`，干扰项长度±1防猜）+ `drawCreative` 创作题 + 含英文引句的题自动提取 `q.say`（答案在选项中则不提取防漏答案）+ 抽题入口 `drawQuestion` |
| `public/static/js/render/map.js` | 等距 2.5D Canvas 渲染（见 §4 约定） |
| `public/static/js/render/assets.js` | 素材加载器：`Assets.opt(id)` 按 manifest 加载，缺失静默回退 emoji/程序绘制（不产生 404） |
| `public/static/js/ui/panels.js` | 侧栏各面板（居民/建造/车库/市政/礼物/**跟读**/设置）；v3.4：`renderReading` 每日跟读（TTS 慢速0.72/正常0.95、"我完成跟读啦"→pending）+ 设置内**家长区**（两位数乘法门 `parentUnlocked` 会话级解锁 → 审批跟读发奖 / 作品集最近20篇 / 学习概况）+ `badge-reading` 未完成提醒 |
| `public/static/js/ui/quiz.js` | 答题弹窗；v3.4：`speak()` 浏览器 speechSynthesis TTS（en-US，导出 `Quiz.speak`）、`q.say` 时插 🔊 再听一遍按钮（选择/填空/判断）、听音题自动播放、`renderCreate` 创作题（textarea ≥20字解锁提交，不判对错恒奖励）、🔁巩固复习徽标（紫）与 📖错题复习（橙）区分 |
| `tools/build-asset-manifest.mjs` | 扫描 `public/static/assets/` 生成 `manifest.json`（webp 优先于 png） |

## 4. 渲染关键约定（改渲染前必读）

- 等距坐标：`iso(gx,gy)`，格宽 `TW`，格高 `TH = TW/2`，菱形地块
- **深度排序**：painter's algorithm（`isoCmp`/`sortIso`）；行人有 `unstick(w)` 防卡建筑；名字/❓/气泡走 overlay 队列画在最上层
- 草地：`(gx+gy)%2` 棋盘格交替 `ground_grass` / `ground_grass2`，贴图按 `TW×TH` 画在菱形包围盒；**素材是正方形俯视图，由我们离线转成四角透明的菱形 webp**
- 道路：`drawRoadIso` — 相邻道路数 ≥3 用 `road_crosswalk`，否则 `road_tile`；**车道标线永远由代码绘制**（`drawRoadMarks` 按拼接方向画黄虚线）→ 所以 road_tile 素材上绝不能带标线
- 车辆：`Assets.opt('veh_'+id)`；镜像条件 `c.tx-c.x+(c.y-c.ty)>=0` 时 `ctx.scale(-1,1)` → **底图车头必须朝左下**
- 帽子：`drawHat` 宽 `size*1.5`，锚点 `cy - h*0.62`
- 角色：走路向右时水平镜像 → **底图人物必须面朝左下**
- 无素材时的程序兜底草地会画"乐高凸点"——那是代码占位画法，**与美术素材风格无关，不要据此给美术加乐高元素**

## 5. 美术：重要决策与管线

**★ 既定风格决策（用户明确拍板，勿改）**：因为 2.5D 地图要精致，美术风格统一为 **Q 版 3D 软胶玩偶 / 黏土微缩**（chibi 3D clay render / vinyl toy），**不用乐高凸点/积木质感**；"乐高"仅保留在游戏名。第一批 53 张素材即此风格。

- 权威清单：`docs/ART_ASSETS.md`；提示词：`ART_PROMPTS_P0/P1/P2.md`；素材投递说明：`art_inbox/README.md`
- 分批状态：第一批 53 张（45 建筑 + 8 家人）✅；第二批 33 张（地面/道路 4 + 装饰 8 + 车辆 21）✅ 2026-08-01 上线，共 86 张；待补：装饰 6（hydrant/fence/pond/bridge/billboard/traffic_light）+ 大型载具 18（火车5/飞机6/船5/火箭2）+ 帽子 8；招募居民 24 张 ⏸️ 暂缓（功能已关）
- **第二批经验（重要）**：用户交的图背景是"假透明棋盘格"烘在 RGB 里（alpha 全 255），需从边框 flood-fill 抠图；白色车身需严格阈值（diff≤8, bright≥233）+ 孔洞回填；地面图用户直接交的是带土层的等距菱形（非俯视正方形），需仿射变换把顶面菱形精确 warp 到 512×256；处理脚本 `/home/user/process_batch2.py` 可复用
- **装饰真实比例 spr 系统**：catalog.js 装饰条目的 `spr` 字段（0.3~1.0，如 trashbin 0.3、tree_big 0.92），map.js `drawBuildingSprite`/`drawGhost` 按 spr 缩宽度并把小物件锚到格子中心附近，避免"垃圾桶比消防车大"
- 接入管线（用户交白底 PNG，我们处理）：
  1. 白底 flood-fill 抠图 + 边缘羽化 → 裁掉空白 → LANCZOS 缩放 → WebP q88
  2. **地面材质额外一步**：正方形俯视图 → 旋转/压扁映射成 2:1 菱形、四角透明
  3. 落到 `public/static/assets/<id>.webp` → `npm run assets:index` → 重新 build → 游戏自动换贴图，**零代码改动**
- 文件名必须与 catalog.js 中的 ID 完全一致

## 6. 经济系统 v3.1（当前版本）

- 建筑解锁按 **`peakIncome()`**（历史最高每周收入 = 工资 + 商业 + 房租），17 档 0→8000
- 老存档迁移：`POP_TO_INCOME` 把旧的人口解锁进度折算成收入，保证老玩家不回退
- 城市等级按 `minIncome`：250/600/1200/2500/5000
- 招募居民关闭：`CATALOG.RECRUIT_ENABLED = false`（数据与代码全保留，改 true 即恢复）
- 每 7 天收税 = 居民工资 10% + 商业营业额 10%；幸福度乘数 0.5x~1.5x 作用于商业

## 7. Git / 部署状态

- 仓库：https://github.com/Niklausex/Rich-sCity ，主分支 `main`（`genspark_ai_developer` 已合并，两分支同点）
- 关键提交：`1acd980`(停车场3×3) → `6f9b627`(v3.1 经济) → `abb54a0`(美术文档) → `7a0d70f`(去乐高化) → `c235525`(v3.2 素材+题库扩容) → `69faf93`(v3.3 已掌握/错题本) → v3.4(五科课程重构+跟读+创作+遗忘曲线+家长区)
- 推送前先调 GitHub 环境认证（Agent 环境：`setup_github_environment`）
- 生产部署：**未做**；做之前必须让用户选部署路径

## 8. 待办清单（按优先级）

1. **等用户交剩余美术**：装饰 6 + 大型载具 18 + 帽子 8（+可选重交：3 辆带卡通脸的车 ambulance/excavator/garbage、双向斑马线 road_crosswalk）→ 按 §5 管线接入
2. 生产环境部署 Cloudflare Pages（先问用户选哪条部署路径）
3. 迭代备选：题库扩到 7~12 年级、英语词汇表继续扩容（现 374 词）、跟读短文扩到 30+ 篇（现 15 篇轮播）、创作题扩容（现 16 题）、地图扩张、随机事件、成就徽章、云存档(D1)、家长区答题报告图表

## 9. 已知的坑

- `Assets.opt()` 只加载 manifest.json 里登记过的 ID——新素材放了文件但没跑 `assets:index` + build 就不会生效
- `wrangler.jsonc` 改动后需 `rm -rf .wrangler && npm run build`
- 每次 Bash 调用都从 `/home/user` 起步，命令要带 `cd /home/user/webapp &&`
- README 里的沙盒预览 URL 会随沙盒重建失效，以 GetServiceUrl 实时结果为准
- 不要给美术提示词里加任何 LEGO/凸点字眼（历史上犯过一次，已在 7a0d70f 修正）
- TTS 用浏览器 speechSynthesis：Chrome 首次 `getVoices()` 返回空数组，quiz.js 加载时已预热一次；无网络依赖但音色随系统而异
- 题目去重键统一走 `Game.qKey(q)`（=`q.qkey || q.q`）——新增题型若题面是通用文案必须给 `qkey`，否则会在 mastered/recent 里互相碰撞
- 家长区解锁状态 `parentUnlocked` 是内存变量（刷新页面重新上锁），故意不落存档
