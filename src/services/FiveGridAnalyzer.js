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
        this.connection = null;
    }

    async getConnection() {
        if (!this.connection) {
            this.connection = await mysql.createConnection(this.dbConfig);
        }
        return this.connection;
    }

    getDefaultRule(gridType, strokes) {
        // 根据笔画数确定五行属性
        const fiveElement = this.getFiveElement(strokes);

        // 基于五行的默认规则
        const defaultRules = {
            '金': {
                general_meaning: `总格数理为${strokes}，五行属金，性格坚毅，意志坚定，具有领导才能。`,
                career_meaning: "适合从事管理、金融、科技等领域，决策能力强。",
                wealth_meaning: "财运基础稳固，善于把握机会，但需谨慎投资。",
                marriage_meaning: "感情态度认真，重视承诺，但需要增加灵活性。",
                health_meaning: "注意呼吸系统，保持适度运动和规律作息。"
            },
            '木': {
                general_meaning: `总格数理为${strokes}，五行属木，性格开朗，富有创造力，适应能力强。`,
                career_meaning: "适合从事创意、教育、文化等工作，发展空间大。",
                wealth_meaning: "财运成长稳定，投资眼光独到，注意稳中求进。",
                marriage_meaning: "感情细腻，重视感情交流，家庭关系和睦。",
                health_meaning: "注意肝胆养护，保持良好的作息习惯。"
            },
            '水': {
                general_meaning: `总格数理为${strokes}，五行属水，思维灵活，智慧充沛，善于沟通。`,
                career_meaning: "适合从事科研、技术、传媒等领域，创新能力强。",
                wealth_meaning: "财运灵活多变，理财能力强，但需防范风险。",
                marriage_meaning: "感情丰富，人际关系好，但需要稳定。",
                health_meaning: "注意肾脏保养，保持充足的休息和运动。"
            },
            '火': {
                general_meaning: `总格数理为${strokes}，五行属火，性格热情，充满活力，表达能力强。`,
                career_meaning: "适合从事销售、市场、领导等工作，拓展能力强。",
                wealth_meaning: "财运活跃，事业发展快，但需注意节制。",
                marriage_meaning: "感情热烈，人缘好，但需要控制情绪。",
                health_meaning: "注意心脑血管，保持情绪稳定和规律运动。"
            },
            '土': {
                general_meaning: `总格数理为${strokes}，五行属土，性格稳重，做事踏实，责任心强。`,
                career_meaning: "适合从事行政、管理、房地产等工作，基础扎实。",
                wealth_meaning: "财运稳健，收入稳定，善于积累财富。",
                marriage_meaning: "感情专一，重视家庭，生活规律。",
                health_meaning: "注意消化系统，保持规律饮食和作息。"
            }
        };

        return {
            grid_type: gridType,
            strokes: strokes,
            score: 80,
            luck_level: '吉',
            five_elements: fiveElement,
            ...defaultRules[fiveElement]
        };
    }

    getFiveElement(strokes) {
        // 根据笔画数确定五行属性
        const remainder = strokes % 10;
        if (remainder === 1 || remainder === 2) return '木';
        if (remainder === 3 || remainder === 4) return '火';
        if (remainder === 5 || remainder === 6) return '土';
        if (remainder === 7 || remainder === 8) return '金';
        return '水';
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
            // 复姓：第一个字的笔画数 + 1
            const tianGe = surnameStrokes[0] + 1;

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
            const zongGe = surnameStrokes.reduce((sum, strokes) => sum + strokes, 0) + diGe;

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
            const connection = await this.getConnection();
            const [rows] = await connection.execute(
                'SELECT `strokes` FROM `chinese_characters` WHERE `character_text` = ?',
                [char]
            );

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
            const connection = await this.getConnection();
            const [rows] = await connection.execute(
                'SELECT * FROM `five_grid_rules_new` WHERE `grid_type` = ? AND `strokes` = ?',
                [gridType, strokes]
            );

            if (rows.length > 0) {
                return rows[0];
            }

            // 如果找不到规则，返回基于五行的默认规则
            return this.getDefaultRule(gridType, strokes);
        } catch (error) {
            console.error('获取格规则时发生错误:', error);
            return this.getDefaultRule(gridType, strokes);
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

    async close() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }
}

module.exports = FiveGridAnalyzer; 