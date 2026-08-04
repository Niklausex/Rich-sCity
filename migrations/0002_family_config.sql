-- 家长可配置的游戏规则（JSON），NULL = 全部用游戏内置默认值
ALTER TABLE families ADD COLUMN config TEXT;
ALTER TABLE families ADD COLUMN config_updated_at INTEGER DEFAULT 0;
