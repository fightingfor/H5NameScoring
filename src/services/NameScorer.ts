import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface CharacterInfo {
    character_text: string;
    strokes: number;
    five_elements: string;
    pinyin: string;
    meaning: string;
}

interface GridRule {
    grid_type: string;
    strokes: number;
    score: number;
    meaning: string;
}

interface ScoreResult {
    total_score: number;
    five_grid_score: number;
    five_elements_score: number;
    cultural_score: number;
    analysis: string;
    details: {
        tian_ge: { score: number; meaning: string };
        ren_ge: { score: number; meaning: string };
        di_ge: { score: number; meaning: string };
        wai_ge: { score: number; meaning: string };
        zong_ge: { score: number; meaning: string };
        five_elements_analysis: string;
        cultural_analysis: string;
    };
}

type FiveElement = '木' | '火' | '土' | '金' | '水';
type FiveElementsRelations = {
    [K in FiveElement]: {
        [K2 in FiveElement]?: number;
    };
};

export class NameScorer {
    private pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306')
        });
    }

    // 获取字符信息
    private async getCharacterInfo(char: string): Promise<CharacterInfo | null> {
        const [rows] = await this.pool.query(
            'SELECT * FROM chinese_characters WHERE character_text = ?',
            [char]
        );
        return (rows as any[])[0] || null;
    }

    // 获取五格数理规则
    private async getGridRule(gridType: string, strokes: number): Promise<GridRule | null> {
        const [rows] = await this.pool.query(
            'SELECT * FROM five_grid_rules WHERE grid_type = ? AND strokes = ?',
            [gridType, strokes]
        );
        return (rows as any[])[0] || null;
    }

    // 计算五格数理分数
    private async calculateFiveGridScore(surname: string, givenName: string): Promise<{
        tian_ge: { score: number; meaning: string };
        ren_ge: { score: number; meaning: string };
        di_ge: { score: number; meaning: string };
        wai_ge: { score: number; meaning: string };
        zong_ge: { score: number; meaning: string };
        total_score: number;
    }> {
        const surnameInfo = await this.getCharacterInfo(surname);
        if (!surnameInfo) throw new Error(`未找到姓氏"${surname}"的信息`);

        const givenNameChars = givenName.split('');
        const givenNameInfos = await Promise.all(
            givenNameChars.map(char => this.getCharacterInfo(char))
        );

        // 计算天格（姓氏笔画数）
        const tianGeStrokes = surnameInfo.strokes;
        const tianGeRule = await this.getGridRule('天格', tianGeStrokes);
        const tianGe = {
            score: tianGeRule?.score || 15,
            meaning: tianGeRule?.meaning || '天格数理规则未找到'
        };

        // 计算人格（姓氏笔画 + 名字第一个字笔画）
        const renGeStrokes = surnameInfo.strokes + (givenNameInfos[0]?.strokes || 0);
        const renGeRule = await this.getGridRule('人格', renGeStrokes);
        const renGe = {
            score: renGeRule?.score || 15,
            meaning: renGeRule?.meaning || '人格数理规则未找到'
        };

        // 计算地格（名字笔画总和）
        const diGeStrokes = givenNameInfos.reduce((sum, info) => sum + (info?.strokes || 0), 0);
        const diGeRule = await this.getGridRule('地格', diGeStrokes);
        const diGe = {
            score: diGeRule?.score || 15,
            meaning: diGeRule?.meaning || '地格数理规则未找到'
        };

        // 计算外格（名字最后一个字笔画）
        const waiGeStrokes = givenNameInfos[givenNameInfos.length - 1]?.strokes || 0;
        const waiGeRule = await this.getGridRule('外格', waiGeStrokes);
        const waiGe = {
            score: waiGeRule?.score || 15,
            meaning: waiGeRule?.meaning || '外格数理规则未找到'
        };

        // 计算总格（姓氏笔画 + 名字笔画总和）
        const zongGeStrokes = surnameInfo.strokes + diGeStrokes;
        const zongGeRule = await this.getGridRule('总格', zongGeStrokes);
        const zongGe = {
            score: zongGeRule?.score || 15,
            meaning: zongGeRule?.meaning || '总格数理规则未找到'
        };

        // 计算五格总分（满分40分）
        const total_score = Math.round(
            (tianGe.score + renGe.score + diGe.score + waiGe.score + zongGe.score) / 5
        );

        return {
            tian_ge: tianGe,
            ren_ge: renGe,
            di_ge: diGe,
            wai_ge: waiGe,
            zong_ge: zongGe,
            total_score
        };
    }

    // 计算五行分数
    private async calculateFiveElementsScore(surname: string, givenName: string): Promise<{
        score: number;
        analysis: string;
    }> {
        const surnameInfo = await this.getCharacterInfo(surname);
        if (!surnameInfo) throw new Error(`未找到姓氏"${surname}"的信息`);

        const givenNameChars = givenName.split('');
        const givenNameInfos = await Promise.all(
            givenNameChars.map(char => this.getCharacterInfo(char))
        );

        // 收集所有字的五行
        const fiveElements = [
            surnameInfo.five_elements,
            ...givenNameInfos.map(info => info?.five_elements || '')
        ].filter(Boolean) as FiveElement[];

        // 计算五行相生相克关系
        const fiveElementsRelations: FiveElementsRelations = {
            '木': { '火': 1, '土': -1 },
            '火': { '土': 1, '金': -1 },
            '土': { '金': 1, '木': -1 },
            '金': { '水': 1, '火': -1 },
            '水': { '木': 1, '土': -1 }
        };

        let harmonyScore = 0;
        for (let i = 0; i < fiveElements.length - 1; i++) {
            const current = fiveElements[i];
            const next = fiveElements[i + 1];
            harmonyScore += fiveElementsRelations[current][next] || 0;
        }

        // 计算五行分数（满分30分）
        const score = Math.max(0, Math.min(30, 15 + harmonyScore * 5));

        // 生成五行分析
        const analysis = this.generateFiveElementsAnalysis(fiveElements, harmonyScore);

        return { score, analysis };
    }

    // 生成五行分析文本
    private generateFiveElementsAnalysis(fiveElements: FiveElement[], harmonyScore: number): string {
        const elementCounts = fiveElements.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {} as Record<FiveElement, number>);

        const dominantElements = Object.entries(elementCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([element]) => element);

        let analysis = `姓名五行以${dominantElements.join('、')}为主。`;

        if (harmonyScore > 0) {
            analysis += '五行相生，主吉利。';
        } else if (harmonyScore < 0) {
            analysis += '五行相克，需注意平衡。';
        } else {
            analysis += '五行平和，主稳定。';
        }

        return analysis;
    }

    // 计算文化内涵分数
    private async calculateCulturalScore(surname: string, givenName: string): Promise<{
        score: number;
        analysis: string;
    }> {
        const surnameInfo = await this.getCharacterInfo(surname);
        if (!surnameInfo) throw new Error(`未找到姓氏"${surname}"的信息`);

        const givenNameChars = givenName.split('');
        const givenNameInfos = await Promise.all(
            givenNameChars.map(char => this.getCharacterInfo(char))
        );

        // 计算文化内涵分数（满分30分）
        let score = 0;
        const meanings = [surnameInfo.meaning, ...givenNameInfos.map(info => info?.meaning || '')];

        // 根据字义评分
        score += meanings.reduce((sum, meaning) => {
            if (meaning.includes('美好') || meaning.includes('优秀') || meaning.includes('光明')) {
                return sum + 10;
            }
            return sum + 5;
        }, 0);

        // 生成文化分析
        const analysis = `姓名寓意${meanings.join('，')}。`;

        return { score, analysis };
    }

    // 主评分方法
    public async scoreName(surname: string, givenName: string): Promise<ScoreResult> {
        try {
            // 计算五格数理分数
            const fiveGridResult = await this.calculateFiveGridScore(surname, givenName);

            // 计算五行分数
            const fiveElementsResult = await this.calculateFiveElementsScore(surname, givenName);

            // 计算文化内涵分数
            const culturalResult = await this.calculateCulturalScore(surname, givenName);

            // 计算总分（满分100分）
            const total_score = Math.round(
                fiveGridResult.total_score * 0.4 + // 五格数理占40%
                fiveElementsResult.score * 0.3 + // 五行占30%
                culturalResult.score * 0.3 // 文化内涵占30%
            );

            // 生成总体分析
            const analysis = `
                姓名评分：${total_score}分
                五格数理：${fiveGridResult.total_score}分
                五行分析：${fiveElementsResult.analysis}
                文化内涵：${culturalResult.analysis}
            `.trim();

            return {
                total_score,
                five_grid_score: fiveGridResult.total_score,
                five_elements_score: fiveElementsResult.score,
                cultural_score: culturalResult.score,
                analysis,
                details: {
                    tian_ge: fiveGridResult.tian_ge,
                    ren_ge: fiveGridResult.ren_ge,
                    di_ge: fiveGridResult.di_ge,
                    wai_ge: fiveGridResult.wai_ge,
                    zong_ge: fiveGridResult.zong_ge,
                    five_elements_analysis: fiveElementsResult.analysis,
                    cultural_analysis: culturalResult.analysis
                }
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`姓名评分失败：${error.message}`);
            }
            throw new Error('姓名评分失败：未知错误');
        }
    }

    // 关闭数据库连接
    public async close() {
        await this.pool.end();
    }
} 