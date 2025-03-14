import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface WugeRule {
    grid_type: '天格' | '人格' | '地格' | '外格' | '总格';
    strokes: number;
    score: number;
    luck_level: '大吉' | '吉' | '半吉' | '凶' | '大凶';
    five_elements: '金' | '木' | '水' | '火' | '土';
    general_meaning: string;
    career_meaning?: string;
    wealth_meaning?: string;
    marriage_meaning?: string;
    health_meaning?: string;
}

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    // 清空表
    await connection.query('TRUNCATE TABLE five_grid_rules');
    return connection;
}

async function importRules(connection: mysql.Connection) {
    // 读取规则数据
    const rulesPath = path.join(__dirname, '../data/wuge/rules.json');
    const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

    // 准备插入语句
    const query = `
        INSERT INTO five_grid_rules 
        (grid_type, strokes, score, luck_level, five_elements, meaning)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 导入每种格的数据
    for (const [gridType, rules] of Object.entries(rulesData)) {
        console.log(`正在导入${gridType}数据...`);

        for (const rule of rules as WugeRule[]) {
            try {
                await connection.query(query, [
                    gridType,
                    rule.strokes,
                    rule.score,
                    rule.luck_level,
                    rule.five_elements,
                    rule.general_meaning
                ]);
            } catch (error) {
                console.error(`导入规则失败: ${gridType} ${rule.strokes}`, error);
            }
        }
    }
}

async function main() {
    try {
        console.log('开始导入五格数理规则...');

        const connection = await initDatabase();
        await importRules(connection);

        console.log('五格数理规则导入完成');
        await connection.end();
    } catch (error) {
        console.error('导入过程失败:', error);
    }
}

main(); 