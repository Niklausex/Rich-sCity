import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import api from './api'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.route('/api', api)

app.use('/static/*', serveStatic({ root: './public' }))

// favicon: 乐高积木 emoji SVG
app.get('/favicon.ico', (c) => {
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🧱</text></svg>`,
    200,
    { 'Content-Type': 'image/svg+xml' }
  )
})

app.notFound((c) => c.text('Not Found', 404))

// 家长后台：独立页面，账号密码登录（同源共享 localStorage 存档）
app.get('/admin', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rich's City · 家长后台</title>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'PingFang SC','Microsoft YaHei',system-ui,sans-serif; background: #f2f4f8; color: #333; min-height: 100vh; }
  .topbar { background: #1e3a5f; color: #fff; padding: 14px 20px; display: flex; align-items: center; gap: 12px; }
  .topbar h1 { font-size: 18px; flex: 1; }
  .topbar .who { font-size: 13px; opacity: .85; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 20px 16px 60px; }
  .card { background: #fff; border-radius: 14px; padding: 18px 20px; margin-top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  .card h3 { font-size: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .card p { font-size: 14px; line-height: 1.8; color: #555; }
  .btn { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 10px; padding: 9px 16px; font-size: 14px; font-weight: 700; cursor: pointer; background: #e9ecef; color: #333; }
  .btn:hover { filter: brightness(.95); }
  .btn-blue { background: #2b6cb0; color: #fff; }
  .btn-green { background: #2f9e44; color: #fff; }
  .btn-red { background: #e03131; color: #fff; }
  .btn-gray { background: #868e96; color: #fff; }
  input { width: 100%; border: 1.5px solid #ccd3dd; border-radius: 10px; padding: 10px 12px; font-size: 15px; margin-top: 8px; }
  input:focus { outline: none; border-color: #2b6cb0; }
  .login-box { max-width: 400px; margin: 8vh auto 0; }
  .login-logo { text-align: center; font-size: 46px; }
  .login-title { text-align: center; font-size: 20px; font-weight: 800; margin-top: 6px; }
  .login-sub { text-align: center; font-size: 13px; color: #888; margin-top: 4px; }
  .err { color: #e03131; font-size: 13px; margin-top: 8px; min-height: 18px; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 10px; margin-top: 10px; }
  .stat-item { background: #f6f8fb; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-item b { display: block; font-size: 22px; color: #1e3a5f; }
  .stat-item span { font-size: 12px; color: #888; }
  .writing { background: #fbfaf6; border: 1.5px solid #e8e2d0; border-radius: 10px; padding: 10px 14px; margin-top: 10px; }
  .writing .w-title { font-weight: 800; font-size: 14px; }
  .writing .w-day { font-weight: 600; color: #999; font-size: 12px; }
  .writing .w-text { font-size: 14px; line-height: 1.8; margin-top: 4px; white-space: pre-wrap; }
  .tag { display: inline-block; background: #e8590c; color: #fff; border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 700; }
  .tag-ok { background: #2f9e44; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
  .muted { color: #999; font-size: 13px; }
  a.link { color: #2b6cb0; font-size: 13px; cursor: pointer; text-decoration: underline; }
  #toast { position: fixed; left: 50%; top: 18px; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 14px; display: none; z-index: 99; }
</style>
</head>
<body>
<div id="toast"></div>
<div id="app"></div>
<script src="/static/js/data/questions-data3.js"></script>
<script src="/static/js/admin.js"></script>
</body>
</html>`)
})

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rich's City - 乐高市长模拟</title>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/css/game.css" rel="stylesheet">
</head>
<body>
<div id="loading-screen">
  <div class="lego-logo">
    <div class="brick b-red"></div><div class="brick b-yellow"></div><div class="brick b-blue"></div><div class="brick b-green"></div>
  </div>
  <h1>Rich's City</h1>
  <p>乐高市长，正在搭建城市...</p>
</div>

<div id="game-root" style="display:none">
  <!-- 顶部状态栏 -->
  <header id="topbar">
    <div class="city-name-box">
      <i class="fas fa-city"></i>
      <span id="city-name">Rich's City</span>
      <span id="city-rank" class="rank-badge">小村庄</span>
    </div>
    <div class="stats-row">
      <div class="stat" title="城市资金"><i class="fas fa-coins gold"></i><span id="stat-money">100</span></div>
      <div class="stat" title="人口（本版本固定8位家人）"><i class="fas fa-users blue"></i><span id="stat-pop">8</span></div>
      <div class="stat" title="幸福度(公共设施带来)"><i class="fas fa-face-smile pink"></i><span id="stat-happy">50</span></div>
      <div class="stat" title="快乐值(居民挣钱越多越快乐)"><i class="fas fa-heart red"></i><span id="stat-joy">50</span></div>
      <div class="stat" title="城市周收入（建筑解锁看这个）"><i class="fas fa-sack-dollar green"></i><span id="stat-income">0</span>/周</div>
      <div class="stat" title="预期周税收"><i class="fas fa-landmark purple"></i><span id="stat-tax">0</span>/周</div>
    </div>
    <div class="day-box">
      <span id="game-date">第1天</span>
      <button id="btn-save-now" class="btn btn-day" title="立即保存游戏进度" style="background:#2f9e44"><i class="fas fa-floppy-disk"></i> 保存</button>
      <button id="btn-sleep" class="btn btn-day" title="结束今天，进入新的一天"><i class="fas fa-moon"></i> 睡觉</button>
    </div>
  </header>

  <!-- 左侧工具栏 -->
  <nav id="sidebar">
    <button class="side-btn" data-panel="residents" title="居民"><i class="fas fa-people-group"></i><span>居民</span><em id="badge-questions" class="badge" style="display:none">0</em></button>
    <button class="side-btn" data-panel="build" title="建造"><i class="fas fa-hammer"></i><span>建造</span></button>
    <button class="side-btn" data-panel="vehicles" title="车库"><i class="fas fa-car-side"></i><span>车库</span></button>
    <button class="side-btn" data-panel="tax" title="市政厅"><i class="fas fa-landmark"></i><span>市政</span><em id="badge-tax" class="badge" style="display:none">!</em></button>
    <button class="side-btn" data-panel="gifts" title="礼物"><i class="fas fa-gift"></i><span>礼物</span><em id="badge-gifts" class="badge" style="display:none">0</em></button>
    <button class="side-btn" data-panel="reading" title="每日跟读"><i class="fas fa-microphone"></i><span>跟读</span><em id="badge-reading" class="badge" style="display:none">!</em></button>
    <button class="side-btn" data-panel="settings" title="设置"><i class="fas fa-gear"></i><span>设置</span></button>
  </nav>

  <!-- 地图画布 -->
  <main id="map-container">
    <canvas id="map-canvas"></canvas>
    <div id="map-hint" class="map-hint" style="display:none"></div>
    <div id="place-toolbar" style="display:none">
      <span id="place-info"></span>
      <button id="btn-place-rotate" class="btn btn-small"><i class="fas fa-rotate"></i></button>
      <button id="btn-place-cancel" class="btn btn-small btn-red"><i class="fas fa-xmark"></i> 取消</button>
    </div>
    <div id="zoom-ctrl">
      <button id="zoom-in" class="btn btn-small"><i class="fas fa-plus"></i></button>
      <button id="zoom-out" class="btn btn-small"><i class="fas fa-minus"></i></button>
      <button id="zoom-fit" class="btn btn-small"><i class="fas fa-expand"></i></button>
    </div>
  </main>

  <!-- 面板容器 -->
  <div id="panel-overlay" style="display:none"></div>
  <div id="panel-box" style="display:none">
    <div id="panel-header"><span id="panel-title"></span><button id="panel-close" class="btn btn-small btn-red"><i class="fas fa-xmark"></i></button></div>
    <div id="panel-content"></div>
  </div>

  <!-- 弹窗容器(答题/事件) -->
  <div id="modal-overlay" style="display:none">
    <div id="modal-box"></div>
  </div>

  <!-- 消息提示 -->
  <div id="toast-box"></div>
</div>

<script src="/static/js/data/questions-data.js"></script>
<script src="/static/js/data/questions-data2.js"></script>
<script src="/static/js/data/questions-data3.js"></script>
<script src="/static/js/data/questions.js"></script>
<script src="/static/js/data/catalog.js"></script>
<script src="/static/js/engine/state.js"></script>
<script src="/static/js/engine/cloud.js"></script>
<script src="/static/js/engine/game.js"></script>
<script src="/static/js/render/assets.js"></script>
<script src="/static/js/render/map.js"></script>
<script src="/static/js/ui/panels.js"></script>
<script src="/static/js/ui/quiz.js"></script>
<script src="/static/js/main.js"></script>
</body>
</html>`)
})

export default app
