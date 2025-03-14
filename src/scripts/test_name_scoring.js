const NameScorer = require('../services/NameScorer');

async function testNameScoring() {
    try {
        const scorer = new NameScorer();

        // 测试姓名
        const testNames = [
            { surname: '张', givenName: '三' }
        ];

        console.log('开始测试姓名评分系统...');

        for (const { surname, givenName } of testNames) {
            console.log(`\n测试姓名: ${surname}${givenName}`);
            console.log('----------------------------------------');

            try {
                // 生成详细报告
                const report = await scorer.generateDetailedReport(surname, givenName);

                // 输出基本信息
                console.log('基本信息:');
                console.log(`姓名: ${report.basicInfo.fullName}`);
                console.log(`姓氏: ${report.basicInfo.surname}`);
                console.log(`名字: ${report.basicInfo.givenName}`);

                // 输出五格数理
                console.log('\n五格数理:');
                console.log(`天格: ${report.fiveGrid.numbers.tianGe}`);
                console.log(`人格: ${report.fiveGrid.numbers.renGe}`);
                console.log(`地格: ${report.fiveGrid.numbers.diGe}`);
                console.log(`外格: ${report.fiveGrid.numbers.waiGe}`);
                console.log(`总格: ${report.fiveGrid.numbers.zongGe}`);

                // 输出评分
                console.log('\n评分:');
                console.log(`总分: ${report.score.total}`);
                console.log(`平均分: ${report.score.average}`);
                console.log(`吉凶等级: ${report.score.luckLevel}`);

                // 输出五行属性
                console.log('\n五行属性:');
                Object.entries(report.fiveElements).forEach(([element, count]) => {
                    console.log(`${element}: ${count}`);
                });

                // 输出详细分析
                console.log('\n详细分析:');
                console.log('事业分析:');
                console.log(report.details.career);
                console.log('\n财运分析:');
                console.log(report.details.wealth);
                console.log('\n婚姻分析:');
                console.log(report.details.marriage);
                console.log('\n健康分析:');
                console.log(report.details.health);

            } catch (error) {
                console.error(`处理姓名 ${surname}${givenName} 时发生错误:`, error);
            }

            console.log('\n========================================');
        }

        console.log('\n测试完成');

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 执行测试
testNameScoring(); 