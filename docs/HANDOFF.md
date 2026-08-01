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
| `public/static/js/engine/game.js` | 经济/税收/幸福度/解锁逻辑（`weeklyIncome()` / `peakIncome()` / `isUnlocked()` / `nextUnlock()`） |
| `public/static/js/data/catalog.js` | **唯一数据源**：59 建筑（含 14 装饰 deco_*）、39 车辆 VEHICLES、8 帽子 HATS、24 招募角色、`RECRUIT_ENABLED=false` |
| `public/static/js/data/questions-data.js` | 语/英/科/通识静态题库（按年级 3~6 分层） |
| `public/static/js/data/questions.js` | 数学题程序化生成器 |
| `public/static/js/render/map.js` | 等距 2.5D Canvas 渲染（见 §4 约定） |
| `public/static/js/render/assets.js` | 素材加载器：`Assets.opt(id)` 按 manifest 加载，缺失静默回退 emoji/程序绘制（不产生 404） |
| `public/static/js/ui/panels.js` | 侧栏各面板（居民/建造/车库/市政/礼物/设置） |
| `public/static/js/ui/quiz.js` | 答题弹窗 |
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
- 分批状态：第一批 53 张（45 建筑 + 8 家人）✅ 已上线；第二批待用户生成——P0 地面4+装饰14 → P1 车辆39 → P2 帽子8；招募居民 24 张 ⏸️ 暂缓（功能已关）
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
- 关键提交：`1acd980`(停车场3×3) → `6f9b627`(v3.1 经济) → `abb54a0`(美术文档全量重写) → `7a0d70f`(地面提示词去乐高化)
- 推送前先调 GitHub 环境认证（Agent 环境：`setup_github_environment`）
- 生产部署：**未做**；做之前必须让用户选部署路径

## 8. 待办清单（按优先级）

1. **等用户交第二批美术** → 按 §5 管线接入（P0 → P1 → P2 顺序）
2. 生产环境部署 Cloudflare Pages（先问用户选哪条部署路径）
3. 迭代备选：题库扩到 7~12 年级、地图扩张、随机事件、成就徽章、云存档(D1)、家长后台

## 9. 已知的坑

- `Assets.opt()` 只加载 manifest.json 里登记过的 ID——新素材放了文件但没跑 `assets:index` + build 就不会生效
- `wrangler.jsonc` 改动后需 `rm -rf .wrangler && npm run build`
- 每次 Bash 调用都从 `/home/user` 起步，命令要带 `cd /home/user/webapp &&`
- README 里的沙盒预览 URL 会随沙盒重建失效，以 GetServiceUrl 实时结果为准
- 不要给美术提示词里加任何 LEGO/凸点字眼（历史上犯过一次，已在 7a0d70f 修正）
