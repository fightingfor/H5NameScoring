import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function enrichKangxiData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'hanzi',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        // 0. 删除已存在的临时表
        console.log('正在清理临时表...');
        await connection.query('DROP TABLE IF EXISTS kangxi_strokecount_enriched');

        // 1. 创建临时表
        console.log('正在创建临时表...');
        await connection.query(`
            CREATE TABLE kangxi_strokecount_enriched (
                id INT AUTO_INCREMENT PRIMARY KEY,
                CodePoint VARCHAR(10) UNIQUE,
                Value VARCHAR(10),
                CharText VARCHAR(10),
                Strokes INT,
                Pinyin VARCHAR(100),
                Meaning TEXT,
                FiveElements VARCHAR(10),
                IsNameChar TINYINT(1),
                IsRegular TINYINT(1)
            )
        `);

        // 2. 从kangxi_strokecount和hanzi表联合查询数据并插入临时表
        console.log('正在导入数据...');
        await connection.query(`
            INSERT INTO kangxi_strokecount_enriched 
                (CodePoint, Value, CharText, Strokes, Pinyin, Meaning, FiveElements, IsNameChar, IsRegular)
            SELECT DISTINCT
                k.CodePoint,
                k.Value,
                k.Character,
                k.Strokes,
                h.pinyin,
                h.xingming,
                h.wuxing,
                CASE WHEN h.is_changyong = '是' THEN 1 ELSE 0 END,
                1
            FROM kangxi_strokecount k
            LEFT JOIN hanzi h ON k.Character = h.hanzi
            WHERE k.Strokes > 0
        `);

        console.log('数据导入完成！');

        // 3. 检查数据
        const [rows] = await connection.query<mysql.RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM kangxi_strokecount_enriched'
        );
        console.log(`成功导入 ${rows[0].total} 条数据`);

        // 4. 备份原表并重命名新表
        console.log('正在备份原表...');
        await connection.query('DROP TABLE IF EXISTS kangxi_strokecount_backup');
        await connection.query(`
            RENAME TABLE 
                kangxi_strokecount TO kangxi_strokecount_backup,
                kangxi_strokecount_enriched TO kangxi_strokecount
        `);

        console.log('数据补充成功！');
        console.log('原表已备份为 kangxi_strokecount_backup');
        console.log('新表包含以下字段：');
        console.log('- id: 自增主键');
        console.log('- CodePoint: 字符编码 (唯一索引)');
        console.log('- Value: 字符值');
        console.log('- CharText: 汉字');
        console.log('- Strokes: 笔画数');
        console.log('- Pinyin: 拼音');
        console.log('- Meaning: 含义');
        console.log('- FiveElements: 五行');
        console.log('- IsNameChar: 是否适合取名');
        console.log('- IsRegular: 是否规范');

    } catch (error) {
        console.error('数据补充失败：', error);
        // 如果失败，尝试清理临时表
        try {
            await connection.query('DROP TABLE IF EXISTS kangxi_strokecount_enriched');
        } catch (cleanupError) {
            console.error('清理临时表失败：', cleanupError);
        }
    } finally {
        await connection.end();
    }
}

enrichKangxiData(); 