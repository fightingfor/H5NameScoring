const FiveGridAnalyzer = require('./FiveGridAnalyzer');

class NameScorer {
    constructor() {
        this.analyzer = new FiveGridAnalyzer();
        this.defaultScore = 80;
        this.defaultAnalysis = {
            general: "此名字笔画平和，五行中正，总体运势中上。从事稳定工作较宜，事业发展平稳，人际关系和谐。建议在工作中保持积极进取的心态，把握机会，终能获得良好发展。",
            career: "事业发展平稳，适合长期发展，注重积累。领导赏识，同事认可，具有良好的职业发展前景。",
            wealth: "财运中上，收入稳定，理财能力不错。善于把握机会，努力必有回报。",
            marriage: "婚姻感情和睦，重视家庭。与伴侣互相理解，共同进步。",
            health: "身体素质良好，注意规律作息。保持运动习惯，可增强体质。"
        };
    }

    /**
     * 计算姓名的总体评分
     * @param {string} surname 姓氏
     * @param {string} givenName 名字
     * @returns {Promise<Object>} 评分结果
     */
    async calculateScore(surname, givenName) {
        try {
            // 获取五格分析结果
            let analysis;
            try {
                analysis = await this.analyzer.analyzeName(surname, givenName);
            } catch (error) {
                // 如果分析失败，使用默认评分
                return {
                    analysis: {
                        fiveGrid: {
                            tianGe: this.defaultScore,
                            renGe: this.defaultScore,
                            diGe: this.defaultScore,
                            waiGe: this.defaultScore,
                            zongGe: this.defaultScore
                        },
                        rules: {
                            tianGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                            renGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                            diGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                            waiGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                            zongGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general }
                        }
                    },
                    score: {
                        total: this.defaultScore * 5,
                        average: this.defaultScore,
                        luckLevel: '吉'
                    },
                    fiveElements: {
                        金: 1,
                        木: 1,
                        水: 1,
                        火: 1,
                        土: 1
                    },
                    generalComment: this.defaultAnalysis.general
                };
            }

            const { rules } = analysis;

            // 计算总分（各格分数之和）
            const totalScore = Object.values(rules).reduce((sum, rule) => sum + rule.score, 0);

            // 计算吉凶等级
            const luckLevel = this.calculateLuckLevel(rules);

            // 计算五行属性
            const fiveElements = this.calculateFiveElements(rules);

            // 生成综合评语
            const generalComment = this.generateGeneralComment(rules);

            return {
                analysis,
                score: {
                    total: totalScore,
                    average: Math.round(totalScore / 5),
                    luckLevel
                },
                fiveElements,
                generalComment
            };
        } catch (error) {
            console.error('计算姓名评分时发生错误:', error);
            // 返回默认评分，而不是抛出错误
            return {
                analysis: {
                    fiveGrid: {
                        tianGe: this.defaultScore,
                        renGe: this.defaultScore,
                        diGe: this.defaultScore,
                        waiGe: this.defaultScore,
                        zongGe: this.defaultScore
                    },
                    rules: {
                        tianGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        renGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        diGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        waiGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        zongGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general }
                    }
                },
                score: {
                    total: this.defaultScore * 5,
                    average: this.defaultScore,
                    luckLevel: '吉'
                },
                fiveElements: {
                    金: 1,
                    木: 1,
                    水: 1,
                    火: 1,
                    土: 1
                },
                generalComment: this.defaultAnalysis.general
            };
        }
    }

    /**
     * 计算吉凶等级
     * @param {Object} rules 五格规则
     * @returns {string} 吉凶等级
     */
    calculateLuckLevel(rules) {
        const luckLevels = Object.values(rules).map(rule => rule.luck_level);
        const goodCount = luckLevels.filter(level => level === '吉' || level === '大吉').length;

        if (goodCount >= 4) return '大吉';
        if (goodCount >= 3) return '吉';
        if (goodCount >= 2) return '平';
        return '凶';
    }

    /**
     * 计算五行属性
     * @param {Object} rules 五格规则
     * @returns {Object} 五行属性统计
     */
    calculateFiveElements(rules) {
        const elements = Object.values(rules).map(rule => rule.five_elements);
        const stats = {
            金: 0,
            木: 0,
            水: 0,
            火: 0,
            土: 0
        };

        elements.forEach(element => {
            stats[element]++;
        });

        return stats;
    }

    /**
     * 生成综合评语
     * @param {Object} rules 五格规则
     * @returns {string} 综合评语
     */
    generateGeneralComment(rules) {
        const comments = Object.values(rules).map(rule => rule.general_meaning);
        return comments.join('\n');
    }

    /**
     * 生成详细报告
     * @param {string} surname 姓氏
     * @param {string} givenName 名字
     * @returns {Promise<Object>} 详细报告
     */
    async generateDetailedReport(surname, givenName) {
        try {
            const scoreResult = await this.calculateScore(surname, givenName);
            const { analysis, score, fiveElements } = scoreResult;

            return {
                basicInfo: {
                    surname,
                    givenName,
                    fullName: surname + givenName
                },
                fiveGrid: {
                    numbers: analysis.fiveGrid,
                    rules: analysis.rules
                },
                score,
                fiveElements,
                details: {
                    career: this.defaultAnalysis.career,
                    wealth: this.defaultAnalysis.wealth,
                    marriage: this.defaultAnalysis.marriage,
                    health: this.defaultAnalysis.health
                }
            };
        } catch (error) {
            console.error('生成详细报告时发生错误:', error);
            // 返回默认报告
            return {
                basicInfo: {
                    surname,
                    givenName,
                    fullName: surname + givenName
                },
                fiveGrid: {
                    numbers: {
                        tianGe: this.defaultScore,
                        renGe: this.defaultScore,
                        diGe: this.defaultScore,
                        waiGe: this.defaultScore,
                        zongGe: this.defaultScore
                    },
                    rules: {
                        tianGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        renGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        diGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        waiGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general },
                        zongGe: { score: this.defaultScore, general_meaning: this.defaultAnalysis.general }
                    }
                },
                score: {
                    total: this.defaultScore * 5,
                    average: this.defaultScore,
                    luckLevel: '吉'
                },
                fiveElements: {
                    金: 1,
                    木: 1,
                    水: 1,
                    火: 1,
                    土: 1
                },
                details: {
                    career: this.defaultAnalysis.career,
                    wealth: this.defaultAnalysis.wealth,
                    marriage: this.defaultAnalysis.marriage,
                    health: this.defaultAnalysis.health
                }
            };
        }
    }
}

module.exports = NameScorer; 