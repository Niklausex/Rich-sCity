# 技术交接文档（Agent Handoff）

> 目的：任何新接手的 Agent / 开发者，只读本文档 + README 即可完整理解项目现状、关键约定与待办。
> 最后更新：2026-08-04（main @ main HEAD，v3.9（题库扩容：语文半生成器 + 科学/通识/判断题扩充））
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
| `src/index.tsx` | Hono 入口，输出 HTML 骨架 + 引 CDN（Tailwind）+ 静态 JS；v3.6 新增 `/admin` 路由（家长后台独立 HTML，内联样式，只挂4个数据/引擎脚本+admin.js）；顶栏加 💾保存按钮 |
| `public/static/js/main.js` | 启动、主循环、事件绑定；**v3.6**：顶栏 `#btn-save-now` 💾保存按钮（Game.save+toast）、`storage` 事件监听（/admin 改存档→本页 toast+1.2s 后 reload 同步） |
| `public/static/js/engine/state.js` | 存档读写、存档迁移（含 v3.1 的 `POP_TO_INCOME` 老档兑换；v3.5 补 `mapW/mapH` 回填 32×24） |
| `public/static/js/engine/game.js` | 经济/税收/幸福度/解锁逻辑（`weeklyIncome()` / `peakIncome()` / `isUnlocked()` / `nextUnlock()`）+ **答题额度系统**：`DAILY_LIMIT=50`（每居民每日上限）、`SUBJECT_WEIGHTS`（英30/科25/通25/数12/语8）、`rollSubject()`、`askedCount/canAsk/refillQuestion`、`S.askedToday` 按居民计数（每天清零）；**已掌握/错题本**：`S.mastered`（答对题面，永久排除，连线题除外，上限5000）、`S.wrongPool`（答错题完整对象，上限200，答对移出）、`drawFor` 30%概率复习错题（`q.review=true`，`reshuffleQuestion` 重洗选项），抽新题排除 recent+mastered；questions.js 各静态库耗尽时返回 null 逐级回退到生成器（数学生成器带排除重试）；**v3.4 新增**：`qKey(q)`（听音/创作题用 `q.qkey` 去重）、`S.reviewQueue` 遗忘曲线（首次答对入队 {key,day,snap}，7天后 `drawFor` 20%概率巩固复习 `q.review='consolidate'`，再对→移出队列真掌握，答错→移出 mastered 重学并入错题本，上限500）、`drawFor` 语文35%概率出创作题（`S.createdToday<2`）、`submitWriting`（存 `S.writings` 上限200 + 恒定奖励）、`todayReading/markReadingDone/approveReading`（每日跟读 todo→pending→approved，审批发 20元+快乐5，`newDayQuestions` 按 `(day-1)%15` 轮播短文并清零 createdToday）；**v3.5 地块扩建**：`EXPAND_STEP={w:8,h:6}`/`EXPAND_MAX=3`/`expandLevel()=(mapW-32)/8`/`expandCost()` 取 `[500,1500,4000][lv]` 否则 null/`expandLand()` 扣钱改 `S.mapW/S.mapH` 并存档（32×24→最大56×42；地面循环与 fitView 实时读 S.mapW/S.mapH，扩建纯状态变更无需重建） |
| `public/static/js/data/catalog.js` | **唯一数据源**：59 建筑（含 14 装饰 deco_*）、39 车辆 VEHICLES、8 帽子 HATS、24 招募角色、`RECRUIT_ENABLED=false` |
| `public/static/js/data/questions-data.js` | 基础静态题库（语/英/科/通识，按年级 3~6 分层） |
| `public/static/js/data/questions-data2.js` | **扩容题库**：`ENGLISH_VOCAB` 分级词汇表 255 词 + 科学/通识/英语 ~208 道新静态题（末尾合并进 `QUESTION_BANK`） |
| `public/static/js/data/questions-data3.js` | **v3.4 课程包**：牛津树/YLE 词汇并入 ENGLISH_VOCAB（去重后 374 词：g3:89/g4:101/g5:96/g6:88）+ EXT2 静态题（英语阅读24/美式通识50/科技科学32/语感鉴赏28，mergeBank 按题面全局去重）+ `window.CREATIVE_PROMPTS`×16 + `window.READ_ALOUD`×15（v3.4.1 每篇扩至 ~250-280 词、4-7 段落含对话、`\\n\\n` 分段、cn 为扩写中文大意） |
| `public/static/js/data/questions.js` | 题目引擎：数学生成器（计算 + **LogicGen 逻辑思维11类**，选择题 60/40 分流）+ 英语词汇生成器（词→义/义→词/拼写辨析/单词连线/字母填空）+ **英语难度+1年级**（`g=min(g+1,6)`）+ `genListenChoice` 听音选词（`q.say`+`qkey='listen:'+word`，干扰项长度±1防猜）+ `drawCreative` 创作题 + 含英文引句的题自动提取 `q.say`（答案在选项中则不提取防漏答案）+ 抽题入口 `drawQuestion` |
| `public/static/js/render/map.js` | 等距 2.5D Canvas 渲染（见 §4 约定）；v3.5：`FLAT_SPRITES` 平铺贴图校正表 + `drawFlatSprite`（停车场专用：按沥青菱形宽缩放、垂直压扁 k≈0.786 对齐网格 0.5 比例、锚点(266,349)钉到占地前角 pC+2px，修"车位偏小+悬空"） |
| `public/static/js/render/assets.js` | 素材加载器：`Assets.opt(id)` 按 manifest 加载，缺失静默回退 emoji/程序绘制（不产生 404） |
| `public/static/js/ui/panels.js` | 侧栏各面板（居民/建造/车库/市政/礼物/**跟读**/设置）；v3.4：`renderReading` 每日跟读（TTS 慢速0.72/正常0.95、"我完成跟读啦"→pending；v3.4.1：长文按 `\\n\\n` 分段渲染、每段前 🔊 逐段播放0.8x、⏹停止按钮、模块级 `document` 监听 `tts-state` 事件控制停止按钮显隐、点播放1.8s后仍无声则显示排查提示、中文大意收进 `<details>`）+ 设置内**家长区**（两位数乘法门 `parentUnlocked` 会话级解锁 → 审批跟读发奖 / 作品集最近20篇 / 学习概况）+ `badge-reading` 未完成提醒；**v3.5**：跟读整篇慢速与逐段🔊统一 `SLOW=0.6`（正常 0.95）、每段旁 + 主栏各一个 `.btn-tts-pause` ⏸暂停/▶继续按钮（全局单播放实例，任一按钮均控当前播放，`tts-state {speaking,paused}` 事件统一同步显隐/文案/绿色态）、`renderBuild` 顶部地块卡片（当前尺寸+`#btn-expand-land` 扩建按钮，成功后 confetti+fitView+刷新，扩满显示🎉）；**v3.6**：设置面板重构——旧"家长区乘法门"整块删除（parentGateHtml/parentAreaHtml/parentUnlocked 已移除，家长功能全部迁到 /admin），存档卡片加 `#btn-save-manual` 立即保存/`#btn-save-export` 导出/`#btn-save-import`+隐藏 file input 导入，新增"🔐家长后台"卡片（`<a href="/admin" target="_blank">`）；模块内 `SaveIO.exportSave/importSave`（与 admin.js 同格式同校验） |
| `public/static/js/ui/quiz.js` | 答题弹窗；v3.4.1：**TTS 引擎重写**——`speak(text,rate,onEnd)` 分句切块（≤180字符）队列播放防 Chrome ~15s 掐断、`cancel()` 后延迟 150ms 再 speak 修 Chrome 静默吞掉 bug、5s `resume()` keepalive 防中途暂停、`speakSession` 计数器作废旧队列、`getVoices()` 缓存+`onvoiceschanged` 监听、播放状态派发 `tts-state` CustomEvent、导出 `Quiz.speak/stopSpeak/isSpeaking`、`q.say` 时插 🔊 再听一遍按钮（选择/填空/判断）、听音题自动播放、`renderCreate` 创作题（textarea ≥20字解锁提交，不判对错恒奖励）、🔁巩固复习徽标（紫）与 📖错题复习（橙）区分；**v3.5 暂停/继续**：`pausedByUser` 标志 + `pauseSpeak/resumeSpeak/isPaused` 导出、keepalive 在用户暂停时跳过 resume、暂停落在分块间隙时用 `resumeHook` 挂起队列（resumeSpeak 调 hook 续播）、`tts-state` detail 扩为 `{speaking,paused}` |
| `public/static/js/admin.js` | **v3.6 家长后台**（`/admin` 独立页，脚本只加载 data3/catalog/state/game 四件套，无渲染层）：账号密码登录（SHA-256+随机盐存 `richs_city_admin_auth`，会话标记 sessionStorage `richs_city_admin_session`；首次访问走设置流程；忘记密码→两位数乘法验证后重置）；仪表盘=跟读审批(调 `Game.approveReading`)/学习概况/作品集20篇/存档管理(导出/导入)/修改密码；⚠️ **只有存在存档时才调 `Game.init()`**（无存档时 init 会新建存档，必须避免）；导出格式 `{_game:'richs_city',_ver:1,_exportedAt,save}`，导入兼容裸存档 JSON、校验 buildings/residents/day 字段、覆盖前 confirm、成功后 reload 走 migrate |
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
| v3.6 | `07aa564` | **家长后台+手动存档**：新增 `/admin` 独立页（admin.js：账号密码登录 SHA-256+盐、首设/登录/改密/乘法门忘记密码重置、跟读审批、学习概况、作品集、存档导出导入；无存档时不 Game.init 防误建档）；游戏内设置面板删掉乘法门家长区（全部迁 /admin）+ 存档卡片（立即保存/导出/导入 SaveIO）+ 家长后台链接；顶栏 💾保存按钮；main.js storage 事件跨页同步；文案"设置→家长区"→"家长后台"；新增 tests/e2e/admintest.mjs（10步全流程），v34ui.mjs 家长门段改为 v3.6 设置断言 |

## 10. 测试（tests/e2e/，playwright-core 无头浏览器）

```bash
cd /home/user/webapp && npm run build && pm2 restart webapp   # 先构建重启
cd /home/user/webapp/tests/e2e && node v34test.mjs   # 逻辑回归：18项检查（跟读状态机/创作保存/遗忘曲线/1500抽泄漏=0）
node v34ui.mjs                                        # UI 回归：跟读面板/家长门/创作题渲染/听音🔊按钮 + 截图
node mastertest.mjs                                   # v3.3 学习闭环专项
cd /home/user/webapp && node tests/e2e/expandtest.mjs # v3.5 地块扩建（穷/富/满级/UI/存档持久化）
node tests/e2e/readingui.mjs                          # 跟读面板 + ⏸暂停按钮三态（speaking/paused/stopped）
node tests/e2e/scaleshot.mjs                          # 建筑摆放截图（含停车场比例目检，输出 /tmp/scale_check.png）
node tests/e2e/admintest.mjs                          # v3.6 家长后台全流程（首设/审批/登录/导出导入回滚/忘记密码）
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
- **/admin 页复用 game.js 的注意事项**：admin.js 只挂 questions-data3/catalog/state/game 四个脚本（够 approveReading/READ_ALOUD 用）；**必须先检查 localStorage 有无存档再调 `Game.init()`**——无存档时 init 会静默新建一份存档，导致孩子首次进游戏不触发欢迎流程。家长账号是纯前端本机方案（SHA-256+盐存 localStorage），防的是孩子、不防技术攻击，属有意取舍；E2E 里 playwright 覆盖 confirm/prompt 用 `page.evaluate(() => { window.confirm = () => true; })`
- 跟读短文 `READ_ALOUD` 的 **title 是轮播锚点语义**（`(day-1)%15` 按下标轮播）：改内容可以，别增删/重排条目，否则老存档当天短文会跳变
- 题目去重键统一走 `Game.qKey(q)`（=`q.qkey || q.q`）——新增题型若题面是通用文案必须给 `qkey`，否则会在 mastered/recent 里互相碰撞
- 家长区解锁状态 `parentUnlocked` 是内存变量（刷新页面重新上锁），故意不落存档


## v3.7 家庭账号 + 云存档 + 生产部署（本节为最新权威信息）

### 部署信息（用户自己的 Cloudflare 账号，BYOK）
- 生产 URL：https://richs-city.pages.dev （项目名 richs-city，production branch=main）
- D1 数据库：richs-city-production，database_id `c72195d8-80c9-4983-83f1-08ed56febcf0`，binding `DB`
- 迁移：`migrations/0001_cloud_save.sql`（families/saves/sessions），本地与远程均已 apply
- 重新部署：`npm run build && npx wrangler pages deploy dist --project-name richs-city`
- 远程迁移：`npx wrangler d1 migrations apply richs-city-production --remote`
- 部署前必须先调用 setup_cloudflare_api_key（cf-byok-deploy skill），严禁 wrangler login

### 新增文件
- `src/api.ts` — 云 API：/api/auth/register|login|logout|me、GET/PUT /api/save（409 冲突检测 baseUpdatedAt/force）、POST /api/parent/approve-reading|change-password|reset-game-password。密码 SHA-256+随机盐，token 128bit，TTL 90 天
- `public/static/js/engine/cloud.js` — window.Cloud：ensureLogin 登录门（#cloud-gate，注册=用户名+游戏密码+家长密码）、syncOnBoot 冲突协调（天数新者优先+confirm）、game-saved 事件 1.5s 防抖推送、离线 30s 重试、visibilitychange 抢救推送。localStorage key `richs_city_cloud` {token,username,baseUpdatedAt}
- `tests/e2e/_cloudlogin.mjs` — 测试辅助：注册临时账号+写 richs_city_cloud 跳过登录门
- `tests/e2e/cloudtest.mjs` — 云同步全流程 E2E（注册门/自动推送/设置卡片/跨设备双 context/409 冲突两分支/退出）

### 改动文件
- admin.js 全量重写为云端版：家长密码登录（kind='parent'）、数据源 GET /api/save、审批走服务端、可改家长密码/重置游戏密码、导入=PUT force 覆盖云端；旧 localStorage 本地账号已废弃。/admin 页脚本精简为 data3+admin.js
- main.js：Cloud.ensureLogin 包裹 Game.init；panels.js：设置面板☁️家庭账号卡片+同步/退出按钮
- state.js save() 派发 game-saved；render/map.js onUp 增加 `if(!Game.state) return` 守卫（登录门期间点击画布曾报 null.buildings）
- ecosystem.config.cjs：`--d1=DB=名称` 格式无效（导致 no such table），正确做法是只用 `--local`，绑定自动读 wrangler.jsonc

### 坑（v3.7 新增）
1. wrangler pages dev 的 --d1 不接受 `BINDING=name` 格式；wrangler.jsonc 已有 d1_databases 时无需 --d1 参数
2. 所有 E2E 必须先过登录门：用 `_cloudlogin.mjs` 的 cloudLogin(pg) 后 reload；7 个旧测试已批量注入
3. 一个家庭账号两个密码：游戏密码（孩子）/家长密码（后台），注册时强制不同；家长可在后台重置游戏密码（会踢掉所有 game token）
4. Cloud.logout 会清 richs_city_cloud + 游戏存档并 reload（防止串档）


## v3.8 家长后台游戏规则配置

### 功能
家长后台新增「🎛️ 游戏规则设置」卡片，可配置并实时下发到孩子游戏端（30s 轮询 + 启动即拉取）：
- 题目难度（年级 3-6，锁定后孩子设置面板变只读；留空=孩子可自调）
- 每位居民每天答题上限（1-200）
- 答对奖励 = 基础(0-100) + 等级×加成(0-50)
- 跟读通过奖励（0-500，后台服务端审批也读此值）
- 每天创作题上限（0-10，0=关闭）
- 科目出题比重（英/科/通/数/语 各 0-100）
- 礼物盒：最多12档，每档 连对题数(≥2)+图标+名称+说明，可增删改

### 实现
- `migrations/0002_family_config.sql`：families 加 config(TEXT JSON) + config_updated_at
- `src/api.ts`：GET /api/config（任意登录角色）、PUT /api/config（仅 parent，sanitizeConfig 白名单校验：范围钳制/礼物档去重排序/权重非全零）；approve-reading 奖励改读 config.readingReward
- `game.js`：DEFAULT_CFG + CFG；`Game.applyConfig(remote)`（grade 锁定会直接改 S.grade 并存档）；`Game.config` getter；`Game.giftTable()`；DAILY_LIMIT 改为 getter；rollSubject/answer奖励/礼物判定/创作题上限/approveReading 全部读 CFG
- `cloud.js`：fetchConfig()（比对 updatedAt，变更时派发 `cloud-config` 事件）；syncOnBoot 先拉配置再进游戏；30s setInterval 轮询；导出 Cloud.fetchConfig
- `main.js`：cloud-config 事件 → toast「爸爸妈妈更新了游戏规则」
- `panels.js`：CFG.grade 非空时难度区变只读锁定提示；礼物说明改用 Game.giftTable()
- `admin.js`：CFG_DEFAULTS/cfgVal/configCardHtml/bindConfigCard；保存 PUT /api/config；「恢复全部默认」PUT 空对象
- E2E：`tests/e2e/configtest.mjs`（默认值/后台改规则/孩子端 fetchConfig 生效/奖励=base+level×perLevel/礼物触发/难度锁定 UI/恢复默认），全部通过；cloudtest/admintest/expandtest/v34test/quiztest 回归通过

### 坑
1. 部署后全球边缘传播需 ~20s，紧接部署就 curl 新接口可能打到旧版本报 Internal Server Error，等待重试即可
2. 孩子端"实时"=30s 轮询（fetchConfig），测试里用 `Cloud.fetchConfig()` 手动触发等价验证
3. config 为 NULL/空对象 = 全默认；applyConfig 用 DEFAULT_CFG 兜底展开，前端不怕缺键


## v3.9 题库扩容（语文半生成器 + 科学/通识扩充）

### 功能
- 新增 `questions-data4.js`（必须在 questions.js 之前加载，index.tsx 已挂两处引用之一——主页；/admin 不需要）：
  1. **语文半生成器 `window.ChineseGen`**：7 类题型由数据表组合生成——近义词(45对)/反义词(40对)/量词搭配(40组)/成语补全+成语释义(40条)/古诗接句(36联)/多音字(24组)，约 225+ 道唯一题
  2. **科学静态题** +35（g3 25 + g4 10）、**通识静态题** +33（g3 25 + g4 8），合并进 QUESTION_BANK（沿用全库按题面去重）
  3. **判断题扩充 `window.JUDGE_BANK_EXT`**：science +10 / general +10，由 questions.js 加载时合并进内部 JUDGE_BANK（按题面去重）
- `questions.js` 抽题逻辑：语文 55% 先走 ChineseGen 生成器；语文静态题耗尽时回退生成器（8 次重试）再走英语词表/数学兜底

### 扩容后规模
静态题 442 → **485**（chinese 56 / english 98 / science 160 / general 171）+ ChineseGen ~225 唯一生成题 + 英语词表生成器（上千）+ 数学纯生成（无限）+ 判断题 36 条。语文实测连抽 200 道唯一 115+。

### E2E
`tests/e2e/banktest.mjs`：data4 加载/生成器抽题唯一性/判断题合并命中/五科各50道无异常/UI 弹窗渲染/无控制台报错，全部通过；quiztest/v34test/configtest 回归通过。

### 坑
1. banktest 里 cloudLogin 必须先 `pg.goto(BASE)` 再调用（helper 内部用相对路径 fetch，需要 origin）
2. Playwright 浏览器用 `chromium.launch()`（走 ~/.cache/ms-playwright），不要指定 executablePath
3. ChineseGen 干扰项已人工保证"安全"（不与正确项近义/反义/可搭配），新增词条时须遵守此规则，否则会出现多个可选正确答案

## v4.0 规划（已与家长确认，等待美术资产）
- 家长自行生成美术：先重绘 ground_grass/ground_grass2/road_tile/road_crosswalk（512×256 等距菱形铺满），再按清单生成 河流/铁轨/桥梁地形砖 + 火车5/船5/飞机6 贴图（详见 turn-12 对话内清单，命名 river_tile/river_bend/rail_tile/rail_curve/rail_cross/bridge_road/bridge_rail/veh_steam 等）
- 玩法：地形层 S.terrain（grass/river/rail）；扩地二选一（草地/水域）；铁轨可铺设（≥15 建筑解锁）；火车沿轨/船在水/飞机停机+飞行贴图（复用 cars-on-road 巡路模式）；旧档迁移自动生成不压建筑的河流
