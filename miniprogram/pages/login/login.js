// pages/login/login.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
    data: {
        selectedRole: '', // teacher 或 principal
        account: '',
        password: '',
        canLogin: false,
        loggingIn: false
    },

    async onLoad() {
        // 自动初始化/更新老师数据（包含账号密码）
        try {
            await db.initTeachers();
        } catch (err) {
            console.error('初始化数据失败:', err);
        }
    },

    onShow() {
        // 如果已登录，直接跳转
        if (app.globalData.isLoggedIn) {
            wx.switchTab({
                url: '/pages/schedule/schedule'
            });
        }
    },

    // 选择角色
    selectRole(e) {
        const role = e.currentTarget.dataset.role;
        this.setData({
            selectedRole: role,
            account: '', // 切换角色时清空输入
            password: ''
        });
        this.updateCanLogin();
    },

    // 重置角色（返回上一步）
    resetRole() {
        this.setData({
            selectedRole: '',
            account: '',
            password: '',
            canLogin: false
        });
    },

    // 输入账号
    onAccountInput(e) {
        this.setData({
            account: e.detail.value
        });
        this.updateCanLogin();
    },

    // 输入密码
    onPasswordInput(e) {
        this.setData({
            password: e.detail.value
        });
        this.updateCanLogin();
    },

    // 更新是否可以登录
    updateCanLogin() {
        const { selectedRole, account, password } = this.data;
        // 简单的非空验证
        const canLogin = selectedRole && account && account.length > 0 && password && password.length > 0;
        this.setData({ canLogin });
    },

    // 处理登录
    async handleLogin() {
        const { selectedRole, account, password } = this.data;

        if (!this.data.canLogin || this.data.loggingIn) {
            return;
        }

        this.setData({ loggingIn: true });
        wx.showLoading({ title: '登录中...' });

        try {
            let currentUser = null;

            if (selectedRole === 'student') {
                // 家长登录：基础验证 (测试用)
                if (account === '18871458537' && password === '18871458537') {
                    currentUser = {
                        id: 'student',
                        name: '家长(测试)',
                        role: 'student'
                    };
                } else {
                    wx.showToast({ title: '账号或密码错误', icon: 'error' });
                    this.setData({ loggingIn: false });
                    return;
                }
            } else {
                // 老师登录：数据库验证
                const result = await db.loginTeacher(account, password);

                if (result.success) {
                    const teacher = result.teacher;
                    currentUser = {
                        id: teacher.teacherId,
                        name: teacher.name,
                        role: 'teacher',
                        color: teacher.color
                    };
                } else {
                    wx.showToast({ title: result.error || '登录失败', icon: 'error' });
                    this.setData({ loggingIn: false });
                    return;
                }
            }

            // 保存登录状态
            app.setCurrentUser(currentUser);

            // 跳转到排课页面
            wx.switchTab({
                url: '/pages/schedule/schedule'
            });

        } catch (err) {
            console.error('登录异常:', err);
            wx.showToast({ title: '系统错误', icon: 'error' });
        } finally {
            wx.hideLoading();
            this.setData({ loggingIn: false });
        }
    }
});
