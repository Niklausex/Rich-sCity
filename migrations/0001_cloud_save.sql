-- 家庭账号（一个账号 = 一个孩子的城市）
CREATE TABLE IF NOT EXISTS families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,          -- 登录名（孩子和家长共用）
  game_salt TEXT NOT NULL,                -- 游戏密码盐
  game_hash TEXT NOT NULL,                -- 游戏密码哈希（孩子登录游戏用）
  parent_salt TEXT NOT NULL,              -- 家长密码盐
  parent_hash TEXT NOT NULL,              -- 家长密码哈希（/admin 后台用）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 云存档（每个家庭一条，UPSERT 更新）
CREATE TABLE IF NOT EXISTS saves (
  family_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,                     -- 存档 JSON
  day INTEGER NOT NULL DEFAULT 1,         -- 冗余：游戏天数（冲突提示用）
  money INTEGER NOT NULL DEFAULT 0,       -- 冗余：金钱（冲突提示用）
  updated_at INTEGER NOT NULL,            -- 毫秒时间戳（冲突检测用）
  device TEXT,                            -- 最后保存的设备标识
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- 会话令牌（游戏端与家长端分开，家长态才能审批）
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  family_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'game',      -- 'game' | 'parent'
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_family ON sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
