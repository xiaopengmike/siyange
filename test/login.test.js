const { initApp, login } = require('./utils');

describe('登录流程与权限回归测试', () => {
    let miniProgram;

    beforeAll(async () => {
        miniProgram = await initApp();
    }, 30000);

    afterAll(async () => {
        await miniProgram.close();
    });

    test('测试[账号不存在]拦截提示', async () => {
        const page = await miniProgram.reLaunch('/pages/login/login');
        await page.waitFor(500);

        // 选择老师角色
        const roleItems = await page.$$('.role-item');
        await roleItems[0].tap();

        // 输入未注册账号
        const inputs = await page.$$('.login-input');
        await inputs[0].input('19900000000');
        await inputs[1].input('password123');

        const loginBtn = await page.$('.login-btn');
        await loginBtn.tap();
        await page.waitFor(1000);

        // 验证仍留在登录页
        const currentPage = await miniProgram.currentPage();
        expect(currentPage.path).toBe('pages/login/login');
    });

    test('测试[密码错误]拦截提示', async () => {
        const page = await miniProgram.reLaunch('/pages/login/login');
        await page.waitFor(500);

        const roleItems = await page.$$('.role-item');
        await roleItems[0].tap();

        // 输入正确账号 + 错误密码
        const inputs = await page.$$('.login-input');
        await inputs[0].input('18871458537');
        await inputs[1].input('wrong_pass');

        const loginBtn = await page.$('.login-btn');
        await loginBtn.tap();
        await page.waitFor(1000);

        const currentPage = await miniProgram.currentPage();
        expect(currentPage.path).toBe('pages/login/login');
    });

    test('测试[老师登录]成功跳转', async () => {
        const currentPage = await login(miniProgram, 'teacher', '18871458537', '18871458537');
        expect(currentPage.path).toBe('pages/schedule/schedule');
    });

    test('测试[校权限]自动赋予验证', async () => {
        const currentPage = await login(miniProgram, 'teacher', '18871458537', '18871458537');

        // 检查页面 Data 中的 isPrincipal 是否为 true
        const pageData = await currentPage.data();
        expect(pageData.isPrincipal).toBe(true);

        // 验证 TabBar 列表长度为 3
        const tabBar = await miniProgram.evaluate(() => {
            const page = getCurrentPages().pop();
            if (typeof page.getTabBar === 'function') {
                return page.getTabBar().data.list;
            }
            return [];
        });
        expect(tabBar.length).toBe(3);
    });
});
