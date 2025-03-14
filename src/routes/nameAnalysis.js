const express = require('express');
const router = express.Router();
const NameScorer = require('../services/NameScorer');

// 创建 NameScorer 实例
const nameScorer = new NameScorer();

/**
 * @api {post} /api/analyze 分析姓名
 * @apiDescription 分析姓名的五格数理
 * @apiBody {String} surname 姓氏
 * @apiBody {String} givenName 名字
 */
router.post('/analyze', async (req, res) => {
    try {
        const { surname, givenName } = req.body;

        // 输入验证
        if (!surname || !givenName) {
            return res.status(400).json({
                success: false,
                message: '姓氏和名字都是必需的'
            });
        }

        // 生成详细报告
        const report = await nameScorer.generateDetailedReport(surname, givenName);

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('分析姓名时发生错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '分析姓名时发生错误'
        });
    }
});

/**
 * @api {get} /api/strokes/:char 获取汉字笔画数
 * @apiDescription 获取单个汉字的笔画数
 * @apiParam {String} char 汉字
 */
router.get('/strokes/:char', async (req, res) => {
    try {
        const { char } = req.params;
        const analyzer = nameScorer.analyzer;
        const strokes = await analyzer.getStrokes(char);

        res.json({
            success: true,
            data: {
                character: char,
                strokes: strokes
            }
        });

    } catch (error) {
        console.error('获取笔画数时发生错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取笔画数时发生错误'
        });
    }
});

/**
 * @api {get} /api/rules/:gridType/:strokes 获取五格规则
 * @apiDescription 获取特定格的规则
 * @apiParam {String} gridType 格类型（天格/人格/地格/外格/总格）
 * @apiParam {Number} strokes 笔画数
 */
router.get('/rules/:gridType/:strokes', async (req, res) => {
    try {
        const { gridType, strokes } = req.params;
        const analyzer = nameScorer.analyzer;
        const rule = await analyzer.getGridRule(gridType, parseInt(strokes, 10));

        res.json({
            success: true,
            data: rule
        });

    } catch (error) {
        console.error('获取规则时发生错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取规则时发生错误'
        });
    }
});

module.exports = router; 