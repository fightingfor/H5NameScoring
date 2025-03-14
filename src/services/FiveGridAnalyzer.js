const mysql = require('mysql2/promise');

class FiveGridAnalyzer {
    constructor() {
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'jin@4117',
            database: 'name_scoring'
        };
    }

    /**
     * 计算姓名的五格数理
     * @param {string} surname 姓氏
     * @param {string} givenName 名字
     * @returns {Object} 五格数理结果
     */
    async calculateFiveGrid(surname, givenName) {
        try {
            // 计算天格（姓氏笔画数 + 1）
            const surnameStrokes = await this.getStrokes(surname);
            const tianGe = surnameStrokes + 1;

            // 计算人格（姓氏最后一个字 + 名字第一个字的笔画数）
            const lastSurnameStrokes = await this.getStrokes(surname.slice(-1));
            const firstGivenStrokes = await this.getStrokes(givenName[0]);
            const renGe = lastSurnameStrokes + firstGivenStrokes;

            // 计算地格（名字所有字的笔画数之和）
            let diGe = 0;
            for (const char of givenName) {
                diGe += await this.getStrokes(char);
            }

            // 计算外格（姓氏第一个字 + 名字最后一个字的笔画数）
            const firstSurnameStrokes = await this.getStrokes(surname[0]);
            const lastGivenStrokes = await this.getStrokes(givenName.slice(-1));
            const waiGe = firstSurnameStrokes + lastGivenStrokes;

            // 计算总格（姓名所有字的笔画数之和）
            const zongGe = surnameStrokes + diGe;

            return {
                tianGe,
                renGe,
                diGe,
                waiGe,
                zongGe
            };
        } catch (error) {
            console.error('计算五格数理时发生错误:', error);
            throw error;
        }
    }

    /**
     * 获取汉字的笔画数
     * @param {string} char 汉字
     * @returns {number} 笔画数
     */
    async getStrokes(char) {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            const [rows] = await connection.execute(
                'SELECT `strokes` FROM `chinese_characters` WHERE `character_text` = ?',
                [char]
            );
            await connection.end();

            if (rows.length > 0) {
                return rows[0].strokes;
            } else {
                throw new Error(`未找到汉字"${char}"的笔画数`);
            }
        } catch (error) {
            console.error('获取笔画数时发生错误:', error);
            throw error;
        }
    }

    /**
     * 获取五格规则
     * @param {string} gridType 格类型
     * @param {number} strokes 笔画数
     * @returns {Object} 规则信息
     */
    async getGridRule(gridType, strokes) {
        try {
            const connection = await mysql.createConnection(this.dbConfig);
            const [rows] = await connection.execute(
                'SELECT * FROM `five_grid_rules_new` WHERE `grid_type` = ? AND `strokes` = ?',
                [gridType, strokes]
            );
            await connection.end();

            if (rows.length > 0) {
                return rows[0];
            } else {
                throw new Error(`未找到${gridType}${strokes}画的规则`);
            }
        } catch (error) {
            console.error('获取格规则时发生错误:', error);
            throw error;
        }
    }

    /**
     * 分析姓名的五格
     * @param {string} surname 姓氏
     * @param {string} givenName 名字
     * @returns {Promise<Object>} 五格分析结果
     */
    async analyzeName(surname, givenName) {
        try {
            // 计算五格数理
            const fiveGrid = await this.calculateFiveGrid(surname, givenName);

            // 获取各格的规则
            const rules = await Promise.all([
                this.getGridRule('天格', fiveGrid.tianGe),
                this.getGridRule('人格', fiveGrid.renGe),
                this.getGridRule('地格', fiveGrid.diGe),
                this.getGridRule('外格', fiveGrid.waiGe),
                this.getGridRule('总格', fiveGrid.zongGe)
            ]);

            return {
                fiveGrid,
                rules: {
                    tianGe: rules[0],
                    renGe: rules[1],
                    diGe: rules[2],
                    waiGe: rules[3],
                    zongGe: rules[4]
                }
            };
        } catch (error) {
            console.error('分析姓名时发生错误:', error);
            throw error;
        }
    }
}

module.exports = FiveGridAnalyzer; 