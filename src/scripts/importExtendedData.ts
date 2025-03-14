import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function importExtendedData() {
    // 创建源数据库和目标数据库的连接
    const sourceConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'hanzi',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    const targetConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        // 1. 从kangxi_strokecount表导入汉字基本信息
        console.log('正在导入汉字基本信息...');
        const [rows] = await sourceConnection.query<mysql.RowDataPacket[]>(`
            SELECT 
                k.CharText as character_text,
                k.Strokes as strokes,
                k.Strokes as kangxi_strokes,
                k.FiveElements as five_elements,
                k.Pinyin as pinyin,
                k.Meaning as meaning,
                k.IsNameChar as is_name_char,
                k.IsRegular as is_regular
            FROM kangxi_strokecount k
            WHERE k.Strokes > 0
            ORDER BY k.Strokes
        `);

        // 清空目标表
        await targetConnection.query('TRUNCATE TABLE chinese_characters');

        // 逐条插入数据
        let successCount = 0;
        for (const row of rows) {
            try {
                await targetConnection.query(
                    'INSERT INTO chinese_characters (character_text, strokes, kangxi_strokes, five_elements, pinyin, meaning, is_name_char, is_regular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        row.character_text,
                        row.strokes,
                        row.kangxi_strokes,
                        row.five_elements,
                        row.pinyin,
                        row.meaning,
                        row.is_name_char,
                        row.is_regular
                    ]
                );
                successCount++;
            } catch (error) {
                console.error(`导入字符 ${row.character_text} 失败:`, error);
            }
        }

        console.log(`汉字基本信息导入完成！成功导入 ${successCount} 个汉字。`);

        // 2. 从wu_ge_lucky表导入五格数理规则
        console.log('正在导入五格数理规则...');
        await targetConnection.query('TRUNCATE TABLE five_grid_rules');

        // 导入天格数理
        await sourceConnection.query(`
            INSERT INTO name_scoring.five_grid_rules (grid_type, strokes, score, meaning)
            SELECT DISTINCT '天格', CONVERT(tian_ge, SIGNED), 20, tian_da_yan
            FROM wu_ge_lucky
            WHERE tian_ge IS NOT NULL AND tian_da_yan IS NOT NULL AND tian_ge > 0
        `);

        // 导入人格数理
        await sourceConnection.query(`
            INSERT INTO name_scoring.five_grid_rules (grid_type, strokes, score, meaning)
            SELECT DISTINCT '人格', CONVERT(ren_ge, SIGNED), 20, ren_da_yan
            FROM wu_ge_lucky
            WHERE ren_ge IS NOT NULL AND ren_da_yan IS NOT NULL AND ren_ge > 0
        `);

        // 导入地格数理
        await sourceConnection.query(`
            INSERT INTO name_scoring.five_grid_rules (grid_type, strokes, score, meaning)
            SELECT DISTINCT '地格', CONVERT(di_ge, SIGNED), 20, di_da_yan
            FROM wu_ge_lucky
            WHERE di_ge IS NOT NULL AND di_da_yan IS NOT NULL AND di_ge > 0
        `);

        // 导入外格数理
        await sourceConnection.query(`
            INSERT INTO name_scoring.five_grid_rules (grid_type, strokes, score, meaning)
            SELECT DISTINCT '外格', CONVERT(wai_ge, SIGNED), 20, wai_da_yan
            FROM wu_ge_lucky
            WHERE wai_ge IS NOT NULL AND wai_da_yan IS NOT NULL AND wai_ge > 0
        `);

        // 导入总格数理
        await sourceConnection.query(`
            INSERT INTO name_scoring.five_grid_rules (grid_type, strokes, score, meaning)
            SELECT DISTINCT '总格', CONVERT(zong_ge, SIGNED), 20, zong_da_yan
            FROM wu_ge_lucky
            WHERE zong_ge IS NOT NULL AND zong_da_yan IS NOT NULL AND zong_ge > 0
        `);

        // 统计导入的规则数量
        const [ruleRows] = await targetConnection.query<mysql.RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM five_grid_rules'
        );
        console.log(`五格数理规则导入完成！成功导入 ${ruleRows[0].total} 条规则。`);

    } catch (error) {
        console.error('数据导入失败：', error);
    } finally {
        await sourceConnection.end();
        await targetConnection.end();
    }
}

importExtendedData(); 