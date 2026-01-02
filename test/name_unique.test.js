const { initApp, login } = require('./utils');

describe('姓名唯一性校验 自动化验证', () => {
    let miniProgram;

    beforeAll(async () => {
        miniProgram = await initApp();
    }, 30000);

    afterAll(async () => {
        await miniProgram.close();
    });

    test('测试[注册]重名拦截', async () => {
        // 假设 "Judy老师" 已存在
        const page = await miniProgram.reLaunch('/pages/register/register');
        await page.waitFor(500);

        // 选择老师角色开始注册
        const roleItems = await page.$$('.role-item');
        await roleItems[0].tap();
        await page.waitFor(500);

        // 输入已存在的老师姓名
        const inputs = await page.$$('.login-input');
        await inputs[0].input('Judy老师');
        await inputs[1].input('13311112222');
        await inputs[2].input('123456');

        const regBtn = await page.$('.login-btn');
        await regBtn.tap();
        await page.waitFor(1500);

        // 验证仍留在注册页（拦截成功）
        const currentPage = await miniProgram.currentPage();
        expect(currentPage.path).toBe('pages/register/register');
    });

    test('测试[新增学生]重名拦截', async () => {
        // 先登录老师账号
        await login(miniProgram, 'teacher', '18871458537', '18871458537');

        // 跳转到添加学生页
        const page = await miniProgram.navigateTo('/pages/student-edit/student-edit?mode=add');
        await page.waitFor(500);

        // 输入一个已存在的姓名 (例如自己 "Judy老师")
        const nameInput = await page.$('.login-input');
        await nameInput.input('Judy老师');

        const submitBtn = await page.$('.btn-primary');
        await submitBtn.tap();
        await page.waitFor(1500);

        // 验证仍留在编辑页
        const currentPage = await miniProgram.currentPage();
        expect(currentPage.path).toBe('pages/student-edit/student-edit');
    });
});
