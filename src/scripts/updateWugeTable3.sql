-- 修改五格数理规则表的吉凶等级字段
ALTER TABLE five_grid_rules MODIFY COLUMN luck_level ENUM('大吉', '吉', '中吉', '半吉', '凶', '大凶') NOT NULL;

-- 清空现有数据
TRUNCATE TABLE five_grid_rules; 