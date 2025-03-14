const FiveGridAnalyzer = require('./FiveGridAnalyzer');

class NameScorer {
    constructor() {
        this.analyzer = new FiveGridAnalyzer();
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
            const analysis = await this.analyzer.analyzeName(surname, givenName);
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
            throw error;
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
                    career: this.generateCareerAnalysis(analysis.rules),
                    wealth: this.generateWealthAnalysis(analysis.rules),
                    marriage: this.generateMarriageAnalysis(analysis.rules),
                    health: this.generateHealthAnalysis(analysis.rules)
                }
            };
        } catch (error) {
            console.error('生成详细报告时发生错误:', error);
            throw error;
        }
    }

    /**
     * 生成事业分析
     * @param {Object} rules 五格规则
     * @returns {string} 事业分析
     */
    generateCareerAnalysis(rules) {
        return Object.values(rules)
            .map(rule => rule.career_meaning)
            .join('\n');
    }

    /**
     * 生成财运分析
     * @param {Object} rules 五格规则
     * @returns {string} 财运分析
     */
    generateWealthAnalysis(rules) {
        return Object.values(rules)
            .map(rule => rule.wealth_meaning)
            .join('\n');
    }

    /**
     * 生成婚姻分析
     * @param {Object} rules 五格规则
     * @returns {string} 婚姻分析
     */
    generateMarriageAnalysis(rules) {
        return Object.values(rules)
            .map(rule => rule.marriage_meaning)
            .join('\n');
    }

    /**
     * 生成健康分析
     * @param {Object} rules 五格规则
     * @returns {string} 健康分析
     */
    generateHealthAnalysis(rules) {
        return Object.values(rules)
            .map(rule => rule.health_meaning)
            .join('\n');
    }
}

module.exports = NameScorer; 