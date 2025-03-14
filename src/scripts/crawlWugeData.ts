import puppeteer, { Page } from 'puppeteer';
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
    await connection.query('TRUNCATE TABLE five_grid_rules_new');
    return connection;
}

async function saveToDatabase(connection: mysql.Connection, rules: WugeRule[]) {
    const query = `
        INSERT INTO five_grid_rules_new 
        (grid_type, strokes, score, luck_level, five_elements, general_meaning, 
         career_meaning, wealth_meaning, marriage_meaning, health_meaning)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const rule of rules) {
        try {
            await connection.query(query, [
                rule.grid_type,
                rule.strokes,
                rule.score,
                rule.luck_level,
                rule.five_elements,
                rule.general_meaning,
                rule.career_meaning || null,
                rule.wealth_meaning || null,
                rule.marriage_meaning || null,
                rule.health_meaning || null
            ]);
        } catch (error) {
            console.error(`保存规则失败: ${rule.grid_type} ${rule.strokes}`, error);
        }
    }
}

async function debugPage(page: Page, url: string) {
    console.log(`\n正在访问: ${url}`);

    try {
        // 访问页面
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000 // 30秒超时
        });

        // 获取页面标题
        const title = await page.title();
        console.log(`页面标题: ${title}`);

        // 获取所有表格
        const tables = await page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map(table => ({
                class: table.className,
                id: table.id,
                rows: table.rows.length,
                cells: Array.from(table.rows).reduce((acc, row) => acc + row.cells.length, 0)
            }));
        });
        console.log('页面中的表格:', tables);

        // 获取所有可能包含五格数理数据的元素
        const elements = await page.evaluate(() => {
            const selectors = [
                '.wuge-table',
                '.wuge',
                '.wuge-data',
                '.name-scoring',
                '.name-analysis',
                'table',
                '.grid-table',
                '.grid-data',
                '.wuge-grid',
                '.wuge-rules',
                '.wuge-meaning',
                '.wuge-score',
                '.wuge-luck',
                '.wuge-element'
            ];

            return selectors.map(selector => ({
                selector,
                count: document.querySelectorAll(selector).length
            }));
        });
        console.log('可能的元素:', elements);

        // 保存页面截图
        const screenshotPath = path.join(__dirname, '../../data/wuge/debug', `${url.replace(/[^a-z0-9]/gi, '_')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`页面截图已保存: ${screenshotPath}`);

        // 保存页面HTML
        const htmlPath = path.join(__dirname, '../../data/wuge/debug', `${url.replace(/[^a-z0-9]/gi, '_')}.html`);
        const html = await page.content();
        fs.writeFileSync(htmlPath, html);
        console.log(`页面HTML已保存: ${htmlPath}`);

    } catch (error) {
        console.error(`访问 ${url} 失败:`, error);
    }
}

async function crawlWugeData() {
    const browser = await puppeteer.launch({
        headless: false, // 设置为 false 以便观察页面加载
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // 创建调试目录
        const debugDir = path.join(__dirname, '../../data/wuge/debug');
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
        }

        // 调试页面
        const page = await browser.newPage();

        // 要调试的网站列表
        const urls = [
            'https://www.zhouyi.cc/wuge/',
            'https://www.xingmingxue.com/wuge/',
            'https://www.xingmingceshi.com/wuge/',
            'https://www.xingming.com/wuge/',
            'https://www.xingming.net/wuge/'
        ];

        // 调试每个网站
        for (const url of urls) {
            await debugPage(page, url);
            // 等待一段时间再访问下一个网站
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // 等待用户手动检查
        console.log('\n请检查页面结构和数据，按回车键继续...');
        await new Promise(resolve => process.stdin.once('data', resolve));

        await page.close();
        await browser.close();

    } catch (error) {
        console.error('调试过程失败:', error);
        await browser.close();
    }
}

crawlWugeData(); 