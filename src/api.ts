/* ============================================================
 * 云存档 API（Cloudflare D1）
 *  POST /api/auth/register  注册家庭账号（用户名+游戏密码+家长密码）
 *  POST /api/auth/login     登录（kind: 'game' | 'parent'）→ token
 *  POST /api/auth/logout    注销当前 token
 *  GET  /api/auth/me        校验 token
 *  GET  /api/save           拉取云存档
 *  PUT  /api/save           推送云存档（带冲突检测 baseUpdatedAt）
 *  POST /api/parent/approve-reading  家长审批跟读（服务端直改云存档）
 * 安全：密码只传明文经 HTTPS，服务端 SHA-256+盐存储；token 128bit 随机
 * ============================================================ */
import { Hono } from 'hono'

type Bindings = { DB: D1Database }

const api = new Hono<{ Bindings: Bindings }>()

const TOKEN_TTL = 1000 * 60 * 60 * 24 * 90 // 90天

/* ---------- 工具 ---------- */
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
function randHex(bytes = 16): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('')
}
async function hashPw(pw: string, salt: string) { return sha256(salt + '::' + pw) }

async function auth(c: any, needRole?: 'parent') {
  const token = (c.req.header('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const row = await c.env.DB.prepare(
    'SELECT s.family_id, s.role, s.expires_at, f.username FROM sessions s JOIN families f ON f.id = s.family_id WHERE s.token = ?'
  ).bind(token).first()
  if (!row || row.expires_at < Date.now()) return null
  if (needRole === 'parent' && row.role !== 'parent') return null
  return { familyId: row.family_id as number, role: row.role as string, username: row.username as string, token }
}

/* ---------- 注册 ---------- */
api.post('/auth/register', async (c) => {
  const { username, gamePassword, parentPassword } = await c.req.json().catch(() => ({}))
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username.trim()))
    return c.json({ ok: false, msg: '用户名需2-20位（字母/数字/中文/下划线）' }, 400)
  if (!gamePassword || gamePassword.length < 4) return c.json({ ok: false, msg: '游戏密码至少4位' }, 400)
  if (!parentPassword || parentPassword.length < 4) return c.json({ ok: false, msg: '家长密码至少4位' }, 400)
  if (gamePassword === parentPassword) return c.json({ ok: false, msg: '家长密码不能和游戏密码相同（防止孩子进后台）' }, 400)

  const uname = username.trim()
  const exists = await c.env.DB.prepare('SELECT id FROM families WHERE username = ?').bind(uname).first()
  if (exists) return c.json({ ok: false, msg: '这个用户名已经被注册啦，换一个吧' }, 409)

  const gs = randHex(), ps = randHex()
  const gh = await hashPw(gamePassword, gs)
  const ph = await hashPw(parentPassword, ps)
  const r = await c.env.DB.prepare(
    'INSERT INTO families (username, game_salt, game_hash, parent_salt, parent_hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(uname, gs, gh, ps, ph).run()
  const familyId = r.meta.last_row_id

  // 直接发游戏态 token（注册即登录）
  const token = randHex(16)
  const now = Date.now()
  await c.env.DB.prepare('INSERT INTO sessions (token, family_id, role, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(token, familyId, 'game', now, now + TOKEN_TTL).run()
  return c.json({ ok: true, token, username: uname, role: 'game' })
})

/* ---------- 登录 ---------- */
api.post('/auth/login', async (c) => {
  const { username, password, kind } = await c.req.json().catch(() => ({}))
  if (!username || !password) return c.json({ ok: false, msg: '请输入用户名和密码' }, 400)
  const role = kind === 'parent' ? 'parent' : 'game'
  const f = await c.env.DB.prepare('SELECT * FROM families WHERE username = ?').bind(String(username).trim()).first()
  if (!f) return c.json({ ok: false, msg: '用户名不存在' }, 401)
  const salt = role === 'parent' ? f.parent_salt : f.game_salt
  const hash = role === 'parent' ? f.parent_hash : f.game_hash
  const h = await hashPw(password, salt as string)
  if (h !== hash) return c.json({ ok: false, msg: role === 'parent' ? '家长密码不对' : '密码不对哦' }, 401)

  const token = randHex(16)
  const now = Date.now()
  await c.env.DB.prepare('INSERT INTO sessions (token, family_id, role, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(token, f.id, role, now, now + TOKEN_TTL).run()
  // 顺手清理过期会话
  await c.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run()
  return c.json({ ok: true, token, username: f.username, role })
})

api.post('/auth/logout', async (c) => {
  const u = await auth(c)
  if (u) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(u.token).run()
  return c.json({ ok: true })
})

api.get('/auth/me', async (c) => {
  const u = await auth(c)
  if (!u) return c.json({ ok: false }, 401)
  return c.json({ ok: true, username: u.username, role: u.role })
})

/* ---------- 云存档 ---------- */
api.get('/save', async (c) => {
  const u = await auth(c)
  if (!u) return c.json({ ok: false, msg: '未登录' }, 401)
  const row = await c.env.DB.prepare('SELECT data, day, money, updated_at, device FROM saves WHERE family_id = ?')
    .bind(u.familyId).first()
  if (!row) return c.json({ ok: true, save: null })
  return c.json({ ok: true, save: JSON.parse(row.data as string), day: row.day, money: row.money, updatedAt: row.updated_at, device: row.device })
})

api.put('/save', async (c) => {
  const u = await auth(c)
  if (!u) return c.json({ ok: false, msg: '未登录' }, 401)
  const body = await c.req.json().catch(() => null)
  if (!body || !body.save || !Array.isArray(body.save.buildings) || typeof body.save.day !== 'number')
    return c.json({ ok: false, msg: '存档数据无效' }, 400)
  const { save, baseUpdatedAt, device, force } = body

  const cur = await c.env.DB.prepare('SELECT day, money, updated_at, device FROM saves WHERE family_id = ?')
    .bind(u.familyId).first()
  // 冲突检测：云端已被其他设备更新（当前基线 != 云端最新），且未强制
  if (cur && !force && baseUpdatedAt != null && cur.updated_at !== baseUpdatedAt) {
    return c.json({
      ok: false, conflict: true,
      cloud: { day: cur.day, money: cur.money, updatedAt: cur.updated_at, device: cur.device },
      msg: '云端存档比你的更新（可能在其他设备玩过）'
    }, 409)
  }
  const now = Date.now()
  const data = JSON.stringify(save)
  if (data.length > 2_000_000) return c.json({ ok: false, msg: '存档过大' }, 413)
  await c.env.DB.prepare(`
    INSERT INTO saves (family_id, data, day, money, updated_at, device) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(family_id) DO UPDATE SET data = excluded.data, day = excluded.day, money = excluded.money, updated_at = excluded.updated_at, device = excluded.device
  `).bind(u.familyId, data, save.day, save.money || 0, now, String(device || '').slice(0, 40)).run()
  return c.json({ ok: true, updatedAt: now })
})

/* ---------- 游戏规则配置（家长设置，孩子端轮询实时生效） ---------- */
// 允许的配置键及校验（白名单，防止塞垃圾数据）
function sanitizeConfig(raw: any): { ok: boolean; cfg?: any; msg?: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, msg: '配置格式错误' }
  const cfg: any = {}
  const num = (v: any, min: number, max: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : null
  }
  if (raw.grade != null) { const v = num(raw.grade, 3, 6); if (v == null) return { ok: false, msg: 'grade 无效' }; cfg.grade = v }
  if (raw.dailyLimit != null) { const v = num(raw.dailyLimit, 1, 200); if (v == null) return { ok: false, msg: 'dailyLimit 无效' }; cfg.dailyLimit = v }
  if (raw.rewardBase != null) { const v = num(raw.rewardBase, 0, 100); if (v == null) return { ok: false, msg: 'rewardBase 无效' }; cfg.rewardBase = v }
  if (raw.rewardPerLevel != null) { const v = num(raw.rewardPerLevel, 0, 50); if (v == null) return { ok: false, msg: 'rewardPerLevel 无效' }; cfg.rewardPerLevel = v }
  if (raw.readingReward != null) { const v = num(raw.readingReward, 0, 500); if (v == null) return { ok: false, msg: 'readingReward 无效' }; cfg.readingReward = v }
  if (raw.maxCreatePerDay != null) { const v = num(raw.maxCreatePerDay, 0, 10); if (v == null) return { ok: false, msg: 'maxCreatePerDay 无效' }; cfg.maxCreatePerDay = v }
  if (raw.subjectWeights != null) {
    if (typeof raw.subjectWeights !== 'object') return { ok: false, msg: 'subjectWeights 无效' }
    const sw: any = {}
    for (const k of ['english', 'science', 'general', 'math', 'chinese']) {
      const v = num(raw.subjectWeights[k], 0, 100)
      if (v == null) return { ok: false, msg: '科目权重无效' }
      sw[k] = v
    }
    if (Object.values(sw).reduce((a: number, b: any) => a + b, 0) <= 0) return { ok: false, msg: '科目权重不能全为0' }
    cfg.subjectWeights = sw
  }
  if (raw.gifts != null) {
    if (!Array.isArray(raw.gifts) || raw.gifts.length > 12) return { ok: false, msg: '礼物列表无效（最多12档）' }
    const gifts = []
    for (const g of raw.gifts) {
      const streak = num(g && g.streak, 2, 1000)
      const name = String((g && g.name) || '').trim().slice(0, 30)
      const icon = String((g && g.icon) || '🎁').slice(0, 8)
      const desc = String((g && g.desc) || '').trim().slice(0, 80)
      if (streak == null || !name) return { ok: false, msg: '每档礼物需要连对题数(≥2)和名称' }
      gifts.push({ streak, name, icon, desc })
    }
    gifts.sort((a, b) => a.streak - b.streak)
    for (let i = 1; i < gifts.length; i++) if (gifts[i].streak === gifts[i - 1].streak) return { ok: false, msg: '礼物档位的连对题数不能重复' }
    cfg.gifts = gifts
  }
  return { ok: true, cfg }
}

// 孩子端/家长端都可读
api.get('/config', async (c) => {
  const u = await auth(c)
  if (!u) return c.json({ ok: false, msg: '未登录' }, 401)
  const f = await c.env.DB.prepare('SELECT config, config_updated_at FROM families WHERE id = ?').bind(u.familyId).first()
  return c.json({ ok: true, config: f && f.config ? JSON.parse(f.config as string) : null, updatedAt: (f && f.config_updated_at) || 0 })
})

// 仅家长可写
api.put('/config', async (c) => {
  const u = await auth(c, 'parent')
  if (!u) return c.json({ ok: false, msg: '需要家长登录' }, 401)
  const body = await c.req.json().catch(() => null)
  const r = sanitizeConfig(body && body.config)
  if (!r.ok) return c.json({ ok: false, msg: r.msg }, 400)
  const now = Date.now()
  await c.env.DB.prepare('UPDATE families SET config = ?, config_updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(r.cfg), now, u.familyId).run()
  return c.json({ ok: true, config: r.cfg, updatedAt: now })
})

/* ---------- 家长：修改家长密码 / 重置游戏密码 ---------- */
api.post('/parent/change-password', async (c) => {
  const u = await auth(c, 'parent')
  if (!u) return c.json({ ok: false, msg: '需要家长登录' }, 401)
  const { oldPassword, newPassword } = await c.req.json().catch(() => ({}))
  if (!newPassword || newPassword.length < 4) return c.json({ ok: false, msg: '新密码至少4位' }, 400)
  const f = await c.env.DB.prepare('SELECT * FROM families WHERE id = ?').bind(u.familyId).first()
  if (!f) return c.json({ ok: false, msg: '账号不存在' }, 404)
  if (await hashPw(oldPassword || '', f.parent_salt as string) !== f.parent_hash)
    return c.json({ ok: false, msg: '当前家长密码不对' }, 401)
  if (await hashPw(newPassword, f.game_salt as string) === f.game_hash)
    return c.json({ ok: false, msg: '家长密码不能和游戏密码相同' }, 400)
  const salt = randHex()
  await c.env.DB.prepare('UPDATE families SET parent_salt = ?, parent_hash = ? WHERE id = ?')
    .bind(salt, await hashPw(newPassword, salt), u.familyId).run()
  return c.json({ ok: true })
})

api.post('/parent/reset-game-password', async (c) => {
  const u = await auth(c, 'parent')
  if (!u) return c.json({ ok: false, msg: '需要家长登录' }, 401)
  const { newPassword } = await c.req.json().catch(() => ({}))
  if (!newPassword || newPassword.length < 4) return c.json({ ok: false, msg: '新密码至少4位' }, 400)
  const f = await c.env.DB.prepare('SELECT * FROM families WHERE id = ?').bind(u.familyId).first()
  if (!f) return c.json({ ok: false, msg: '账号不存在' }, 404)
  if (await hashPw(newPassword, f.parent_salt as string) === f.parent_hash)
    return c.json({ ok: false, msg: '游戏密码不能和家长密码相同' }, 400)
  const salt = randHex()
  await c.env.DB.prepare('UPDATE families SET game_salt = ?, game_hash = ? WHERE id = ?')
    .bind(salt, await hashPw(newPassword, salt), u.familyId).run()
  // 旧的游戏 token 全部失效，孩子设备需用新密码重新登录
  await c.env.DB.prepare("DELETE FROM sessions WHERE family_id = ? AND role = 'game'").bind(u.familyId).run()
  return c.json({ ok: true })
})

/* ---------- 家长审批（服务端直改云存档，防绕过） ---------- */
api.post('/parent/approve-reading', async (c) => {
  const u = await auth(c, 'parent')
  if (!u) return c.json({ ok: false, msg: '需要家长登录' }, 401)
  const row = await c.env.DB.prepare('SELECT data, updated_at FROM saves WHERE family_id = ?').bind(u.familyId).first()
  if (!row) return c.json({ ok: false, msg: '还没有云存档' }, 404)
  const s = JSON.parse(row.data as string)
  if (!s.reading || s.reading.status !== 'pending') return c.json({ ok: false, msg: '没有待审批的跟读' })
  s.reading.status = 'approved'
  const fam = await c.env.DB.prepare('SELECT config FROM families WHERE id = ?').bind(u.familyId).first()
  const fcfg = fam && fam.config ? JSON.parse(fam.config as string) : {}
  const reward = typeof fcfg.readingReward === 'number' ? fcfg.readingReward : 20
  s.money = (s.money || 0) + reward
  s.joy = Math.min(100, (s.joy || 0) + 5)
  s.log = s.log || []
  s.log.unshift(`[第${s.day}天] 家长确认跟读完成！奖励 ${reward} 元 + 快乐值 +5`)
  if (s.log.length > 60) s.log.pop()
  const now = Date.now()
  await c.env.DB.prepare('UPDATE saves SET data = ?, money = ?, updated_at = ?, device = ? WHERE family_id = ?')
    .bind(JSON.stringify(s), s.money, now, 'parent-admin', u.familyId).run()
  return c.json({ ok: true, reward, updatedAt: now, save: s })
})

export default api
