ALTER TABLE five_grid_rules
ADD COLUMN five_elements ENUM('金', '木', '水', '火', '土') NOT NULL AFTER score,
MODIFY COLUMN luck_level ENUM('大吉', '吉', '中吉', '半吉', '凶', '大凶') NOT NULL;

-- 清空现有数据
TRUNCATE TABLE five_grid_rules; 