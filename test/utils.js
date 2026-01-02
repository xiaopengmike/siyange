const automator = require('miniprogram-automator');

/**
 * 初始化并连接到小程序模拟器
 */
async function initApp() {
    return await automator.launch({
        projectPath: 'c:/Users/ZhuanZ1/Documents/思研阁 老师排课小程序' // 必须是绝对路径
    });
}

/**
 * 模拟登录操作
 * @param {Object} miniProgram 小程序实例
 * @param {string} role 角色 (teacher/student)
 * @param {string} account 账号
 * @param {string} password 密码
 */
async function login(miniProgram, role, account, password) {
    const page = await miniProgram.reLaunch('/pages/login/login');
    await page.waitFor(1000);

    // 1. 选择角色
    const roleItems = await page.$$('.role-item');
    if (role === 'teacher') {
        await roleItems[0].tap();
    } else {
        await roleItems[1].tap();
    }
    await page.waitFor(500);

    // 2. 输入账号密码
    const inputs = await page.$$('.login-input');
    await inputs[0].input(account);
    await inputs[1].input(password);
    await page.waitFor(500);

    // 3. 点击进入
    const loginBtn = await page.$('.login-btn');
    await loginBtn.tap();
    await page.waitFor(2000); // 等待跳转

    return await miniProgram.currentPage();
}

module.exports = {
    initApp,
    login
};
