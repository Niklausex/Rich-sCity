# 技术交接文档（Agent Handoff）

> 目的：任何新接手的 Agent / 开发者，只读本文档 + README 即可完整理解项目现状、关键约定与待办。
> 最后更新：2026-08-01（main @ 4bd443f，v3.5）
> ⚠️ **文档更新规约（对所有 Agent 强制）**：每次功能变更后，必须同步更新 ①本文档（模块地图/版本演进/待办/坑）②README（功能清单/数据架构/最后更新行）③本头部的提交号。这是用户明确要求，目的是任何模型可无缝接手。

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
| `public/static/js/engine/state.js` | 存档读写、存档迁移（含 v3.1 的 `POP_TO_INCOME` 老档兑换；v3.5 补 `mapW/mapH` 回填 32×24） |
| `public/static/js/engine/game.js` | 经济/税收/幸福度/解锁逻辑（`weeklyIncome()` / `peakIncome()` / `isUnlocked()` / `nextUnlock()`）+ **答题额度系统**：`DAILY_LIMIT=50`（每居民每日上限）、`SUBJECT_WEIGHTS`（英30/科25/通25/数12/语8）、`rollSubject()`、`askedCount/canAsk/refillQuestion`、`S.askedToday` 按居民计数（每天清零）；**已掌握/错题本**：`S.mastered`（答对题面，永久排除，连线题除外，上限5000）、`S.wrongPool`（答错题完整对象，上限200，答对移出）、`drawFor` 30%概率复习错题（`q.review=true`，`reshuffleQuestion` 重洗选项），抽新题排除 recent+mastered；questions.js 各静态库耗尽时返回 null 逐级回退到生成器（数学生成器带排除重试）；**v3.4 新增**：`qKey(q)`（听音/创作题用 `q.qkey` 去重）、`S.reviewQueue` 遗忘曲线（首次答对入队 {key,day,snap}，7天后 `drawFor` 20%概率巩固复习 `q.review='consolidate'`，再对→移出队列真掌握，答错→移出 mastered 重学并入错题本，上限500）、`drawFor` 语文35%概率出创作题（`S.createdToday<2`）、`submitWriting`（存 `S.writings` 上限200 + 恒定奖励）、`todayReading/markReadingDone/approveReading`（每日跟读 todo→pending→approved，审批发 20元+快乐5，`newDayQuestions` 按 `(day-1)%15` 轮播短文并清零 createdToday）；**v3.5 地块扩建**：`EXPAND_STEP={w:8,h:6}`/`EXPAND_MAX=3`/`expandLevel()=(mapW-32)/8`/`expandCost()` 取 `[500,1500,4000][lv]` 否则 null/`expandLand()` 扣钱改 `S.mapW/S.mapH` 并存档（32×24→最大56×42；地面循环与 fitView 实时读 S.mapW/S.mapH，扩建纯状态变更无需重建） |
| `public/static/js/data/catalog.js` | **唯一数据源**：59 建筑（含 14 装饰 deco_*）、39 车辆 VEHICLES、8 帽子 HATS、24 招募角色、`RECRUIT_ENABLED=false` |
| `public/static/js/data/questions-data.js` | 基础静态题库（语/英/科/通识，按年级 3~6 分层） |
| `public/static/js/data/questions-data2.js` | **扩容题库**：`ENGLISH_VOCAB` 分级词汇表 255 词 + 科学/通识/英语 ~208 道新静态题（末尾合并进 `QUESTION_BANK`） |
| `public/static/js/data/questions-data3.js` | **v3.4 课程包**：牛津树/YLE 词汇并入 ENGLISH_VOCAB（去重后 374 词：g3:89/g4:101/g5:96/g6:88）+ EXT2 静态题（英语阅读24/美式通识50/科技科学32/语感鉴赏28，mergeBank 按题面全局去重）+ `window.CREATIVE_PROMPTS`×16 + `window.READ_ALOUD`×15（v3.4.1 每篇扩至 ~250-280 词、4-7 段落含对话、`\\n\\n` 分段、cn 为扩写中文大意） |
| `public/static/js/data/questions.js` | 题目引擎：数学生成器（计算 + **LogicGen 逻辑思维11类**，选择题 60/40 分流）+ 英语词汇生成器（词→义/义→词/拼写辨析/单词连线/字母填空）+ **英语难度+1年级**（`g=min(g+1,6)`）+ `genListenChoice` 听音选词（`q.say`+`qkey='listen:'+word`，干扰项长度±1防猜）+ `drawCreative` 创作题 + 含英文引句的题自动提取 `q.say`（答案在选项中则不提取防漏答案）+ 抽题入口 `drawQuestion` |
| `public/static/js/render/map.js` | 等距 2.5D Canvas 渲染（见 §4 约定）；v3.5：`FLAT_SPRITES` 平铺贴图校正表 + `drawFlatSprite`（停车场专用：按沥青菱形宽缩放、垂直压扁 k≈0.786 对齐网格 0.5 比例、锚点(266,349)钉到占地前角 pC+2px，修"车位偏小+悬空"） |
| `public/static/js/render/assets.js` | 素材加载器：`Assets.opt(id)` 按 manifest 加载，缺失静默回退 emoji/程序绘制（不产生 404） |
| `public/static/js/ui/panels.js` | 侧栏各面板（居民/建造/车库/市政/礼物/**跟读**/设置）；v3.4：`renderReading` 每日跟读（TTS 慢速0.72/正常0.95、"我完成跟读啦"→pending；v3.4.1：长文按 `\\n\\n` 分段渲染、每段前 🔊 逐段播放0.8x、⏹停止按钮、模块级 `document` 监听 `tts-state` 事件控制停止按钮显隐、点播放1.8s后仍无声则显示排查提示、中文大意收进 `<details>`）+ 设置内**家长区**（两位数乘法门 `parentUnlocked` 会话级解锁 → 审批跟读发奖 / 作品集最近20篇 / 学习概况）+ `badge-reading` 未完成提醒；**v3.5**：跟读整篇慢速与逐段🔊统一 `SLOW=0.6`（正常 0.95）、每段旁 + 主栏各一个 `.btn-tts-pause` ⏸暂停/▶继续按钮（全局单播放实例，任一按钮均控当前播放，`tts-state {speaking,paused}` 事件统一同步显隐/文案/绿色态）、`renderBuild` 顶部地块卡片（当前尺寸+`#btn-expand-land` 扩建按钮，成功后 confetti+fitView+刷新，扩满显示🎉） |
| `public/static/js/ui/quiz.js` | 答题弹窗；v3.4.1：**TTS 引擎重写**——`speak(text,rate,onEnd)` 分句切块（≤180字符）队列播放防 Chrome ~15s 掐断、`cancel()` 后延迟 150ms 再 speak 修 Chrome 静默吞掉 bug、5s `resume()` keepalive 防中途暂停、`speakSession` 计数器作废旧队列、`getVoices()` 缓存+`onvoiceschanged` 监听、播放状态派发 `tts-state` CustomEvent、导出 `Quiz.speak/stopSpeak/isSpeaking`、`q.say` 时插 🔊 再听一遍按钮（选择/填空/判断）、听音题自动播放、`renderCreate` 创作题（textarea ≥20字解锁提交，不判对错恒奖励）、🔁巩固复习徽标（紫）与 📖错题复习（橙）区分；**v3.5 暂停/继续**：`pausedByUser` 标志 + `pauseSpeak/resumeSpeak/isPaused` 导出、keepalive 在用户暂停时跳过 resume、暂停落在分块间隙时用 `resumeHook` 挂起队列（resumeSpeak 调 hook 续播）、`tts-state` detail 扩为 `{speaking,paused}` |
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

## 9. 版本演进史（每次更新必须追加一行）

| 版本 | 提交 | 内容摘要 |
|---|---|---|
| v3.0 | — | 美术贴图版：52张自制素材接入，等距2.5D渲染管线 |
| v3.1 | `6f9b627` | 经济系统：解锁改按每周收入 peakIncome，17档；招募关闭固定8家人 |
| v3.2 | `c235525` | 第二批素材33张（共86）；英语词汇生成器+科学/通识扩容；每居民每日50题+科目权重 |
| v3.3 | `69faf93` | 学习闭环：mastered 答对永久排除 + wrongPool 错题本30%复习直到答对；抽题防泄漏修复 |
| v3.4 | `0d0490a` | **五科课程重构**：牛津树英语+1年级/听音选词TTS/ORT阅读；每日跟读+家长审批(20元+快乐5)；语文创作题(打字≥20字恒奖励)；数学逻辑思维11类(60/40)；美式通识50题；科技科学32题；遗忘曲线巩固复习(7天/20%)；设置内家长区(乘法门/作品集/学习概况)；qkey 去重体系 |
| v3.4.1 | `fb9dbb8` | **跟读修复+扩容**：TTS 引擎重写修"点了没声音"（Chrome cancel后立刻speak被吞→150ms延迟；单条长语音~15s被掐→分句队列；voices异步→缓存+onvoiceschanged；5s resume keepalive；tts-state事件/stopSpeak/isSpeaking）；15篇跟读短文全部扩至 ~250-280 词（约10倍，多段落+对话，标题不变故存档轮播不受影响）；跟读面板分段渲染+逐段🔊+⏹停止+无声排查提示；新增 tests/e2e/readingui.mjs |
| v3.5 | `4bd443f` | **跟读暂停+慢速+车位修复+地块扩建**：TTS 引擎支持暂停/继续（pausedByUser/resumeHook/keepalive 守卫），每段+主栏 ⏸暂停按钮全局同步；慢速 0.72→0.6（整篇慢速与逐段统一）；停车场贴图校正 FLAT_SPRITES/drawFlatSprite（贴图沥青菱形比例 0.636 vs 网格 0.5 → 压扁 k≈0.786+锚点钉齐，修偏小+悬空）；地块扩建 expandLand（500/1500/4000 三档，+8×6/次，最多3次至56×42，建造面板顶部卡片）；migrate 补 mapW/mapH；新增 tests/e2e/expandtest.mjs、scaleshot.mjs，readingui.mjs 加暂停断言 |

## 10. 测试（tests/e2e/，playwright-core 无头浏览器）

```bash
cd /home/user/webapp && npm run build && pm2 restart webapp   # 先构建重启
cd /home/user/webapp/tests/e2e && node v34test.mjs   # 逻辑回归：18项检查（跟读状态机/创作保存/遗忘曲线/1500抽泄漏=0）
node v34ui.mjs                                        # UI 回归：跟读面板/家长门/创作题渲染/听音🔊按钮 + 截图
node mastertest.mjs                                   # v3.3 学习闭环专项
cd /home/user/webapp && node tests/e2e/expandtest.mjs # v3.5 地块扩建（穷/富/满级/UI/存档持久化）
node tests/e2e/readingui.mjs                          # 跟读面板 + ⏸暂停按钮三态（speaking/paused/stopped）
node tests/e2e/scaleshot.mjs                          # 建筑摆放截图（含停车场比例目检，输出 /tmp/scale_check.png）
```
- 依赖 `playwright-core`：不在 webapp/node_modules 里，靠 Node 向上解析到 `/home/user/node_modules`（沙盒重建后若缺失：`cd /home/user && npm i playwright-core`）
- 脚本内测试完会 `localStorage.clear()` 或注入状态，**不要对着用户正在玩的存档跑**
- 若 playwright 报 `modal-overlay intercepts pointer events`：开局欢迎弹窗/面板遮罩挡点击，先 `evaluate` 关掉再点

## 11. 已知的坑

- `Assets.opt()` 只加载 manifest.json 里登记过的 ID——新素材放了文件但没跑 `assets:index` + build 就不会生效
- `wrangler.jsonc` 改动后需 `rm -rf .wrangler && npm run build`
- 每次 Bash 调用都从 `/home/user` 起步，命令要带 `cd /home/user/webapp &&`
- README 里的沙盒预览 URL 会随沙盒重建失效，以 GetServiceUrl 实时结果为准
- 不要给美术提示词里加任何 LEGO/凸点字眼（历史上犯过一次，已在 7a0d70f 修正）
- **TTS 三大 Chrome 坑（v3.4.1 已在 quiz.js 引擎层修掉，改 TTS 代码前必读）**：① `speechSynthesis.cancel()` 之后同步调 `speak()` 会被 Chrome 静默丢弃 → 必须延迟 ~150ms；② 单条 utterance 播 ~15s 会被自动掐断 → 长文必须分句切块（≤180字符）经 `onend` 串成队列；③ 播放中会被自动 pause → 需 5s 间隔 `resume()` keepalive。另：首次 `getVoices()` 返回空数组（已缓存+onvoiceschanged 监听）；无网络依赖但音色随系统而异；headless 浏览器无语音引擎，E2E 里只能用 `tts-state` 事件桩测 UI 反馈（见 readingui.mjs）
- **平铺型贴图（停车场类 fl:0）不能走通用 drawBuildingSprite**：美术贴图自身的等距投影角度往往和游戏网格（宽:高=2:1，比例0.5）不一致——parking.webp 实测沥青菱形 517×329=0.636，直接按占地宽缩放会"缩小悬空+四周露草"。解法见 map.js `FLAT_SPRITES` 校正表：逐贴图实测 {imW,imH,lotW,lotH,anchorX,anchorY}（用像素测量沥青菱形四角），横向按占地菱形宽定 scale、纵向乘压扁系数 k、把贴图底角精确钉到占地前角 pC（+2px 咬地）。**新增其他平铺贴图（广场/球场等）必须同样实测标定后加进 FLAT_SPRITES，不要目测**
- 跟读短文 `READ_ALOUD` 的 **title 是轮播锚点语义**（`(day-1)%15` 按下标轮播）：改内容可以，别增删/重排条目，否则老存档当天短文会跳变
- 题目去重键统一走 `Game.qKey(q)`（=`q.qkey || q.q`）——新增题型若题面是通用文案必须给 `qkey`，否则会在 mastered/recent 里互相碰撞
- 家长区解锁状态 `parentUnlocked` 是内存变量（刷新页面重新上锁），故意不落存档
