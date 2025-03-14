import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 基础汉字数据
const chineseCharactersData = [
    // 常用姓氏
    { character_text: '李', strokes: 7, five_elements: '木', pinyin: 'lǐ', meaning: '李树、李子，常用姓氏之一' },
    { character_text: '王', strokes: 4, five_elements: '木', pinyin: 'wáng', meaning: '君主、国王，常用姓氏之一' },
    { character_text: '张', strokes: 7, five_elements: '木', pinyin: 'zhāng', meaning: '弓弦、开展，常用姓氏之一' },
    { character_text: '刘', strokes: 6, five_elements: '金', pinyin: 'liú', meaning: '杀、斩，常用姓氏之一' },
    { character_text: '陈', strokes: 7, five_elements: '土', pinyin: 'chén', meaning: '古时称年代久远，常用姓氏之一' },
    { character_text: '杨', strokes: 7, five_elements: '木', pinyin: 'yáng', meaning: '木名，常用姓氏之一' },
    { character_text: '黄', strokes: 12, five_elements: '土', pinyin: 'huáng', meaning: '黄色、帝王之色，常用姓氏之一' },
    { character_text: '赵', strokes: 9, five_elements: '火', pinyin: 'zhào', meaning: '跑、跳，常用姓氏之一' },
    { character_text: '吴', strokes: 7, five_elements: '水', pinyin: 'wú', meaning: '古国名，常用姓氏之一' },
    { character_text: '周', strokes: 8, five_elements: '土', pinyin: 'zhōu', meaning: '周到、完备，常用姓氏之一' },

    // 常用名字用字（男）
    { character_text: '伟', strokes: 7, five_elements: '金', pinyin: 'wěi', meaning: '伟大、高大' },
    { character_text: '强', strokes: 11, five_elements: '金', pinyin: 'qiáng', meaning: '强壮、有力' },
    { character_text: '军', strokes: 7, five_elements: '水', pinyin: 'jūn', meaning: '军队、军人' },
    { character_text: '磊', strokes: 15, five_elements: '土', pinyin: 'lěi', meaning: '石头堆积、光明磊落' },
    { character_text: '明', strokes: 8, five_elements: '火', pinyin: 'míng', meaning: '明亮、光明' },
    { character_text: '永', strokes: 5, five_elements: '水', pinyin: 'yǒng', meaning: '永远、永恒' },
    { character_text: '浩', strokes: 10, five_elements: '水', pinyin: 'hào', meaning: '广大、浩瀚' },
    { character_text: '天', strokes: 4, five_elements: '火', pinyin: 'tiān', meaning: '天空、自然' },
    { character_text: '海', strokes: 10, five_elements: '水', pinyin: 'hǎi', meaning: '海洋、宽广' },
    { character_text: '志', strokes: 7, five_elements: '火', pinyin: 'zhì', meaning: '意志、志向' },

    // 常用名字用字（女）
    { character_text: '芳', strokes: 7, five_elements: '木', pinyin: 'fāng', meaning: '香气、美好' },
    { character_text: '娟', strokes: 10, five_elements: '水', pinyin: 'juān', meaning: '美好、妩媚' },
    { character_text: '敏', strokes: 11, five_elements: '火', pinyin: 'mǐn', meaning: '敏捷、聪明' },
    { character_text: '静', strokes: 14, five_elements: '金', pinyin: 'jìng', meaning: '安静、平静' },
    { character_text: '秀', strokes: 7, five_elements: '木', pinyin: 'xiù', meaning: '优秀、秀美' },
    { character_text: '丽', strokes: 7, five_elements: '火', pinyin: 'lì', meaning: '美丽、漂亮' },
    { character_text: '雪', strokes: 11, five_elements: '水', pinyin: 'xuě', meaning: '雪、洁白' },
    { character_text: '婷', strokes: 11, five_elements: '金', pinyin: 'tíng', meaning: '优雅、美好' },
    { character_text: '玉', strokes: 5, five_elements: '土', pinyin: 'yù', meaning: '玉石、美好' },
    { character_text: '萍', strokes: 11, five_elements: '木', pinyin: 'píng', meaning: '浮萍、温柔' }
];

// 五格数理规则数据
const fiveGridRulesData = [
    // 天格（1-30分）
    { grid_type: '天格', strokes: 1, score: 20, meaning: '太极之数，万物开始。意指混沌未开，太极始基' },
    { grid_type: '天格', strokes: 2, score: 25, meaning: '两仪之数，代表阴阳调和。主吉利、温和' },
    { grid_type: '天格', strokes: 3, score: 30, meaning: '三才之数，代表天地人和谐。主聪明、才智' },
    { grid_type: '天格', strokes: 4, score: 15, meaning: '四象之数，虽稳定但显平凡。主安稳' },
    { grid_type: '天格', strokes: 5, score: 28, meaning: '五行之数，代表五行圆满。主事业有成' },

    // 人格（1-30分）
    { grid_type: '人格', strokes: 1, score: 23, meaning: '独立之数，主独立自主、有主见' },
    { grid_type: '人格', strokes: 2, score: 28, meaning: '和合之数，主理想化、贵人相助' },
    { grid_type: '人格', strokes: 3, score: 30, meaning: '达道之数，主才智优秀、学识丰富' },
    { grid_type: '人格', strokes: 4, score: 20, meaning: '稳重之数，主踏实稳健、中庸平和' },
    { grid_type: '人格', strokes: 5, score: 25, meaning: '五行之数，主灵活变通、适应力强' },

    // 地格（1-30分）
    { grid_type: '地格', strokes: 1, score: 18, meaning: '基础之数，主开创性强' },
    { grid_type: '地格', strokes: 2, score: 25, meaning: '双立之数，主合作共赢' },
    { grid_type: '地格', strokes: 3, score: 27, meaning: '展现之数，主表现欲强' },
    { grid_type: '地格', strokes: 4, score: 20, meaning: '安定之数，主沉稳踏实' },
    { grid_type: '地格', strokes: 5, score: 23, meaning: '周全之数，主周到细致' },

    // 外格（1-30分）
    { grid_type: '外格', strokes: 1, score: 15, meaning: '独特之数，主个性突出' },
    { grid_type: '外格', strokes: 2, score: 20, meaning: '和气之数，主人缘好' },
    { grid_type: '外格', strokes: 3, score: 25, meaning: '表达之数，主善于交际' },
    { grid_type: '外格', strokes: 4, score: 18, meaning: '社交之数，主为人随和' },
    { grid_type: '外格', strokes: 5, score: 22, meaning: '灵活之数，主应变能力强' },

    // 总格（1-30分）
    { grid_type: '总格', strokes: 1, score: 20, meaning: '元始之数，主有领导才能' },
    { grid_type: '总格', strokes: 2, score: 25, meaning: '完满之数，主圆满成功' },
    { grid_type: '总格', strokes: 3, score: 30, meaning: '大成之数，主才德兼备' },
    { grid_type: '总格', strokes: 4, score: 22, meaning: '守成之数，主稳健发展' },
    { grid_type: '总格', strokes: 5, score: 28, meaning: '隆昌之数，主名利双收' }
];

async function importBaseData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        // 导入汉字数据
        for (const char of chineseCharactersData) {
            await connection.query(
                'INSERT IGNORE INTO chinese_characters (character_text, strokes, five_elements, pinyin, meaning) VALUES (?, ?, ?, ?, ?)',
                [char.character_text, char.strokes, char.five_elements, char.pinyin, char.meaning]
            );
        }
        console.log('汉字数据导入成功！');

        // 导入五格数理规则数据
        for (const rule of fiveGridRulesData) {
            await connection.query(
                'INSERT IGNORE INTO five_grid_rules (grid_type, strokes, score, meaning) VALUES (?, ?, ?, ?)',
                [rule.grid_type, rule.strokes, rule.score, rule.meaning]
            );
        }
        console.log('五格数理规则数据导入成功！');

    } catch (error) {
        console.error('数据导入失败：', error);
    } finally {
        await connection.end();
    }
}

importBaseData(); 