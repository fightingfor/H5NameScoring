const fs = require('fs').promises;
const path = require('path');

async function mergeRules() {
    try {
        // 读取所有规则文件
        const originalPath = path.join(__dirname, '../data/wuge/rules.json');
        const supplementPath = path.join(__dirname, '../data/wuge/rules_supplement.json');
        const rengePath = path.join(__dirname, '../data/wuge/rules_supplement_renge.json');

        const originalData = JSON.parse(await fs.readFile(originalPath, 'utf8'));
        const supplementData = JSON.parse(await fs.readFile(supplementPath, 'utf8'));
        const rengeData = JSON.parse(await fs.readFile(rengePath, 'utf8'));

        // 合并规则
        const mergedData = { ...originalData };

        // 合并函数
        function mergeGridRules(sourceData) {
            for (const [gridType, rules] of Object.entries(sourceData)) {
                if (!mergedData[gridType]) {
                    mergedData[gridType] = [];
                }
                mergedData[gridType] = [...mergedData[gridType], ...rules];
            }
        }

        // 合并补充数据
        mergeGridRules(supplementData);
        mergeGridRules(rengeData);

        // 处理每个格类型
        for (const gridType of Object.keys(mergedData)) {
            // 按笔画数排序
            mergedData[gridType].sort((a, b) => a.strokes - b.strokes);

            // 去重（基于笔画数）
            const seen = new Set();
            mergedData[gridType] = mergedData[gridType].filter(rule => {
                if (seen.has(rule.strokes)) {
                    return false;
                }
                seen.add(rule.strokes);
                return true;
            });
        }

        // 保存合并后的文件
        const mergedPath = path.join(__dirname, '../data/wuge/rules_merged.json');
        await fs.writeFile(mergedPath, JSON.stringify(mergedData, null, 4), 'utf8');
        console.log('规则合并完成，已保存到 rules_merged.json');

        // 输出每个格的规则数量和笔画范围
        for (const [gridType, rules] of Object.entries(mergedData)) {
            console.log(`${gridType}: ${rules.length} 条规则`);
            const strokes = rules.map(r => r.strokes).sort((a, b) => a - b);
            console.log(`笔画范围: ${Math.min(...strokes)}-${Math.max(...strokes)}`);
            console.log('笔画列表:', strokes.join(', '));
            console.log('---');
        }

    } catch (error) {
        console.error('合并过程中发生错误:', error);
    }
}

// 执行合并
mergeRules(); 