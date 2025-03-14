import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function importFromHanziDB() {
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
        // 1. 从hanzi表导入汉字基本信息
        const [hanziRows] = await sourceConnection.query(
            'SELECT hanzi, jt_zongbihua as strokes, wuxing as five_elements, pinyin, xingming as meaning FROM hanzi WHERE is_changyong = "是"'
        );

        for (const row of hanziRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO chinese_characters (character_text, strokes, five_elements, pinyin, meaning) VALUES (?, ?, ?, ?, ?)',
                [row.hanzi, row.strokes, row.five_elements, row.pinyin, row.meaning || '']
            );
        }
        console.log('汉字基本信息导入成功！');

        // 2. 从wu_ge_lucky表导入五格数理规则
        const [wuGeRows] = await sourceConnection.query(
            'SELECT tian_ge as strokes, tian_da_yan as meaning FROM wu_ge_lucky WHERE tian_ge IS NOT NULL AND tian_da_yan IS NOT NULL'
        );

        for (const row of wuGeRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                ['天格', row.strokes, 20, row.meaning]
            );
        }

        const [renGeRows] = await sourceConnection.query(
            'SELECT ren_ge as strokes, ren_da_yan as meaning FROM wu_ge_lucky WHERE ren_ge IS NOT NULL AND ren_da_yan IS NOT NULL'
        );

        for (const row of renGeRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                ['人格', row.strokes, 20, row.meaning]
            );
        }

        const [diGeRows] = await sourceConnection.query(
            'SELECT di_ge as strokes, di_da_yan as meaning FROM wu_ge_lucky WHERE di_ge IS NOT NULL AND di_da_yan IS NOT NULL'
        );

        for (const row of diGeRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                ['地格', row.strokes, 20, row.meaning]
            );
        }

        const [waiGeRows] = await sourceConnection.query(
            'SELECT wai_ge as strokes, wai_da_yan as meaning FROM wu_ge_lucky WHERE wai_ge IS NOT NULL AND wai_da_yan IS NOT NULL'
        );

        for (const row of waiGeRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                ['外格', row.strokes, 20, row.meaning]
            );
        }

        const [zongGeRows] = await sourceConnection.query(
            'SELECT zong_ge as strokes, zong_da_yan as meaning FROM wu_ge_lucky WHERE zong_ge IS NOT NULL AND zong_da_yan IS NOT NULL'
        );

        for (const row of zongGeRows as any[]) {
            await targetConnection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                ['总格', row.strokes, 20, row.meaning]
            );
        }
        console.log('五格数理规则导入成功！');

    } catch (error) {
        console.error('数据导入失败：', error);
    } finally {
        await sourceConnection.end();
        await targetConnection.end();
    }
}

importFromHanziDB(); 