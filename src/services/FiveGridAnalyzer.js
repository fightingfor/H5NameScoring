const mysql = require('mysql2/promise');

class FiveGridAnalyzer {
    constructor() {
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'jin@4117',
            database: 'name_scoring'
        };
        // 默认笔画数（用于找不到字的情况）
        this.defaultStrokes = 15;
    }

    /**
     * 计算姓名的五格数理
     * @param {string} surname 姓氏
     * @param {string} givenName 名字
     * @returns {Object} 五格数理结果
     */
    async calculateFiveGrid(surname, givenName) {
        try {
            // 获取姓氏每个字的笔画数
            const surnameStrokes = [];
            for (const char of surname) {
                try {
                    const strokes = await this.getStrokes(char);
                    surnameStrokes.push(strokes);
                } catch (error) {
                    console.warn(`未找到汉字"${char}"的笔画数，使用默认值${this.defaultStrokes}`);
                    surnameStrokes.push(this.defaultStrokes);
                }
            }

            // 获取名字每个字的笔画数
            const givenNameStrokes = [];
            for (const char of givenName) {
                try {
                    const strokes = await this.getStrokes(char);
                    givenNameStrokes.push(strokes);
                } catch (error) {
                    console.warn(`未找到汉字"${char}"的笔画数，使用默认值${this.defaultStrokes}`);
                    givenNameStrokes.push(this.defaultStrokes);
                }
            }

            // 计算天格
            // 单姓：姓氏笔画数 + 1
            // 复姓：两个字的笔画总和 + 1
            const surnameTotal = surnameStrokes.reduce((sum, strokes) => sum + strokes, 0);
            const tianGe = surnameTotal + 1;

            // 计算人格
            // 单姓：姓氏笔画数 + 名字第一字笔画数
            // 复姓：复姓第二字笔画数 + 名字第一字笔画数
            const lastSurnameStrokes = surnameStrokes[surnameStrokes.length - 1];
            const firstGivenStrokes = givenNameStrokes[0] || this.defaultStrokes;
            const renGe = lastSurnameStrokes + firstGivenStrokes;

            // 计算地格（名字所有字的笔画数之和）
            const diGe = givenNameStrokes.reduce((sum, strokes) => sum + strokes, 0);

            // 计算外格
            // 单姓：姓氏笔画数 + 名字最后一字笔画数
            // 复姓：复姓第一字笔画数 + 名字最后一字笔画数
            const firstSurnameStrokes = surnameStrokes[0];
            const lastGivenStrokes = givenNameStrokes[givenNameStrokes.length - 1] || this.defaultStrokes;
            const waiGe = firstSurnameStrokes + lastGivenStrokes;

            // 计算总格（姓名所有字的笔画数之和）
            const zongGe = surnameTotal + diGe;

            return {
                tianGe,
                renGe,
                diGe,
                waiGe,
                zongGe,
                // 添加详细信息用于调试
                debug: {
                    surnameStrokes,
                    givenNameStrokes,
                    isCompoundSurname: surname.length > 1
                }
            };
        } catch (error) {
            console.error('计算五格数理时发生错误:', error);
            // 返回默认值而不是抛出错误
            return {
                tianGe: this.defaultStrokes + 1,
                renGe: this.defaultStrokes * 2,
                diGe: this.defaultStrokes * 2,
                waiGe: this.defaultStrokes * 2,
                zongGe: this.defaultStrokes * 3,
                debug: {
                    surnameStrokes: [this.defaultStrokes],
                    givenNameStrokes: [this.defaultStrokes, this.defaultStrokes],
                    isCompoundSurname: false
                }
            };
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
            }

            // 如果找不到规则，返回默认规则而不是抛出错误
            return {
                grid_type: gridType,
                strokes: strokes,
                score: 80,
                luck_level: '吉',
                general_meaning: "此数理平和，主运势平稳，利于稳定发展。",
                career_meaning: "事业发展平稳，具有良好的发展前景。",
                wealth_meaning: "财运中上，收入稳定，理财能力不错。",
                marriage_meaning: "婚姻感情和睦，重视家庭。",
                health_meaning: "身体素质良好，保持规律作息。"
            };
        } catch (error) {
            console.error('获取格规则时发生错误:', error);
            // 返回默认规则而不是抛出错误
            return {
                grid_type: gridType,
                strokes: strokes,
                score: 80,
                luck_level: '吉',
                general_meaning: "此数理平和，主运势平稳，利于稳定发展。",
                career_meaning: "事业发展平稳，具有良好的发展前景。",
                wealth_meaning: "财运中上，收入稳定，理财能力不错。",
                marriage_meaning: "婚姻感情和睦，重视家庭。",
                health_meaning: "身体素质良好，保持规律作息。"
            };
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
            // 返回默认分析结果而不是抛出错误
            const defaultRule = {
                score: 80,
                luck_level: '吉',
                general_meaning: "此数理平和，主运势平稳，利于稳定发展。",
                career_meaning: "事业发展平稳，具有良好的发展前景。",
                wealth_meaning: "财运中上，收入稳定，理财能力不错。",
                marriage_meaning: "婚姻感情和睦，重视家庭。",
                health_meaning: "身体素质良好，保持规律作息。"
            };

            return {
                fiveGrid: {
                    tianGe: this.defaultStrokes + 1,
                    renGe: this.defaultStrokes * 2,
                    diGe: this.defaultStrokes * 2,
                    waiGe: this.defaultStrokes * 2,
                    zongGe: this.defaultStrokes * 3
                },
                rules: {
                    tianGe: { ...defaultRule, grid_type: '天格', strokes: this.defaultStrokes + 1 },
                    renGe: { ...defaultRule, grid_type: '人格', strokes: this.defaultStrokes * 2 },
                    diGe: { ...defaultRule, grid_type: '地格', strokes: this.defaultStrokes * 2 },
                    waiGe: { ...defaultRule, grid_type: '外格', strokes: this.defaultStrokes * 2 },
                    zongGe: { ...defaultRule, grid_type: '总格', strokes: this.defaultStrokes * 3 }
                }
            };
        }
    }
}

module.exports = FiveGridAnalyzer; 