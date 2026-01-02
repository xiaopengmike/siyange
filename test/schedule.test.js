const { initApp, login } = require('./utils');

describe('排课核心业务 自动化验证', () => {
    let miniProgram;

    beforeAll(async () => {
        miniProgram = await initApp();
    }, 30000);

    afterAll(async () => {
        await miniProgram.close();
    });

    test('测试[老师视角]排课列表加载', async () => {
        // 登录 Judy老师 (超级账号)
        const page = await login(miniProgram, 'teacher', '18871458537', '18871458537');
        await page.waitFor(1000);

        // 验证页面渲染了课表容器
        const scheduleContainer = await page.$('.schedule-container');
        expect(scheduleContainer).not.toBeNull();

        // 验证当前选择的是自己
        const pageData = await page.data();
        expect(pageData.currentTeacher.name).toBe('Judy老师');
    });

    test('测试[学生视角]隐藏编辑权限', async () => {
        // 登录学生 Siyi Xiao
        const page = await login(miniProgram, 'student', '17665388809', '17665388809');
        await page.waitFor(1000);

        // 尝试寻找添加按钮 (老师视角才有的 add-btn)
        const addBtn = await page.$('.add-btn');
        expect(addBtn).toBeNull(); // 学生不应看到添加按钮

        // 验证 Data 状态
        const pageData = await page.data();
        expect(pageData.isStudent).toBe(true);
    });
});
