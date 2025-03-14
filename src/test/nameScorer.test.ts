import { NameScorer } from '../services/NameScorer';

async function testNameScorer() {
    const scorer = new NameScorer();

    try {
        // 测试用例1：李伟
        console.log('\n测试用例1：李伟');
        const result1 = await scorer.scoreName('李', '伟');
        console.log(JSON.stringify(result1, null, 2));

        // 测试用例2：王芳
        console.log('\n测试用例2：王芳');
        const result2 = await scorer.scoreName('王', '芳');
        console.log(JSON.stringify(result2, null, 2));

        // 测试用例3：张明
        console.log('\n测试用例3：张明');
        const result3 = await scorer.scoreName('张', '明');
        console.log(JSON.stringify(result3, null, 2));

    } catch (error) {
        console.error('测试失败：', error);
    } finally {
        await scorer.close();
    }
}

testNameScorer(); 