const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'jin@4117',
    database: 'name_scoring'
};

async function importRules() {
    try {
        // 读取合并后的rules.json文件
        const rulesPath = path.join(__dirname, '../data/wuge/rules_merged.json');
        const rulesData = JSON.parse(await fs.readFile(rulesPath, 'utf8'));

        // 创建数据库连接
        const connection = await mysql.createConnection(dbConfig);
        console.log('数据库连接成功');

        // 清空现有数据
        await connection.execute('TRUNCATE TABLE five_grid_rules_new');
        console.log('已清空现有数据');

        // 准备插入语句
        const insertSql = `
            INSERT INTO five_grid_rules_new 
            (grid_type, strokes, score, luck_level, five_elements, 
             general_meaning, career_meaning, wealth_meaning, 
             marriage_meaning, health_meaning)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // 遍历每个格类型
        for (const [gridType, rules] of Object.entries(rulesData)) {
            console.log(`开始导入${gridType}的数据...`);

            // 对规则进行排序，确保按笔画数顺序导入
            const sortedRules = rules.sort((a, b) => a.strokes - b.strokes);

            for (const rule of sortedRules) {
                // 准备插入数据
                const values = [
                    gridType,
                    rule.strokes,
                    rule.score,
                    rule.luck_level,
                    rule.five_elements,
                    rule.general_meaning,
                    rule.career_meaning,
                    rule.wealth_meaning,
                    rule.marriage_meaning,
                    rule.health_meaning
                ];

                // 执行插入
                await connection.execute(insertSql, values);
            }

            console.log(`${gridType}数据导入完成`);
        }

        // 验证导入的数据
        const [result] = await connection.execute('SELECT COUNT(*) as count FROM five_grid_rules_new');
        console.log(`总共导入 ${result[0].count} 条记录`);

        // 按格类型统计数据
        const [stats] = await connection.execute(`
            SELECT grid_type, 
                   COUNT(*) as count,
                   MIN(strokes) as min_strokes,
                   MAX(strokes) as max_strokes
            FROM five_grid_rules_new 
            GROUP BY grid_type
        `);

        console.log('\n各格类型数据统计：');
        stats.forEach(stat => {
            console.log(`${stat.grid_type}: ${stat.count}条规则，笔画范围：${stat.min_strokes}-${stat.max_strokes}`);
        });

        // 关闭数据库连接
        await connection.end();
        console.log('\n数据库连接已关闭');

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    }
}

// 执行导入
importRules(); 