// pages/login/login.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
    data: {
        selectedRole: '', // teacher 或 principal
        account: '',
        password: '',
        canLogin: false,
        loggingIn: false,
        teachers: [], // 老师列表
        selectedTeacherIndex: -1 // 选中的老师索引
    },

    async onLoad() {
        // 自动初始化/更新老师数据（包含账号密码）
        try {
            await db.initTeachers();
            await this.fetchTeachers();

            // 1. 恢复上次登录的身份和账号
            const lastLogin = wx.getStorageSync('last_login_info');
            if (lastLogin) {
                this.setData({
                    selectedRole: lastLogin.role,
                    account: lastLogin.account,
                    selectedTeacherIndex: lastLogin.selectedTeacherIndex !== undefined ? lastLogin.selectedTeacherIndex : -1
                });

                // 2. 尝试从密码本中获取密码
                const savedPasswords = wx.getStorageSync('saved_passwords') || {};
                const savedPassword = savedPasswords[lastLogin.account];

                if (savedPassword) {
                    this.setData({
                        password: savedPassword,
                        rememberPassword: true
                    });
                }

                this.updateCanLogin();
            }
        } catch (err) {
            console.error('初始化数据失败:', err);
        }
    },

    // 获取老师列表供选择
    async fetchTeachers(role) {
        // 如果是老师角色，不传参获取所有；如果是校长，传 'principal'
        const filterRole = role === 'principal' ? 'principal' : null;
        const teachers = await db.getTeachers(filterRole);
        this.setData({ teachers });
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
            password: '',
            selectedTeacherIndex: -1,
            teachers: [] // 先清空列表
        });

        // 根据角色加载对应的列表 (老师 or 校长)
        this.fetchTeachers(role);

        this.updateCanLogin();
    },

    // 选择老师姓名
    onTeacherPickerChange(e) {
        const index = e.detail.value;
        const teacher = this.data.teachers[index];
        const account = teacher.phone;

        // 尝试自动填充密码
        const savedPasswords = wx.getStorageSync('saved_passwords') || {};
        const savedPassword = savedPasswords[account];

        this.setData({
            selectedTeacherIndex: index,
            account: account,
            password: savedPassword || '', // 有则填充，无则清空
            rememberPassword: !!savedPassword // 有密码则默认勾选记住
        });

        this.updateCanLogin();
    },

    // 重置角色（返回上一步）
    resetRole() {
        this.setData({
            selectedRole: '',
            account: '',
            password: '',
            canLogin: false,
            selectedTeacherIndex: -1
        });
    },

    onGoToRegister() {
        wx.navigateTo({
            url: `/pages/register/register?role=${this.data.selectedRole}`
        });
    },

    // 输入账号
    onAccountInput(e) {
        const account = e.detail.value;
        this.setData({
            account
        });

        // 尝试自动填充密码 (针对校长/学生手动输入)
        const savedPasswords = wx.getStorageSync('saved_passwords') || {};
        if (savedPasswords[account]) {
            this.setData({
                password: savedPasswords[account],
                rememberPassword: true
            });
        }

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

    // 记住密码变更
    onRememberPasswordChange(e) {
        this.setData({
            rememberPassword: e.detail.value.length > 0
        });
    },

    // 处理登录
    async handleLogin() {
        const { selectedRole, account, password, rememberPassword } = this.data;

        if (!this.data.canLogin || this.data.loggingIn) {
            return;
        }

        this.setData({ loggingIn: true });
        wx.showLoading({ title: '登录中...' });

        try {
            let currentUser = null;

            if (selectedRole === 'principal') {
                // 校长登录：调用同一接口，但后续标记身份
                const result = await db.loginTeacher(account, password);

                if (result.success) {
                    const user = result.teacher;
                    // 如果选择了校长角色登录，强制赋予 principal 权限
                    // 或者可以根据特定账号判断，但用户明确要求有这两个角色选择
                    currentUser = {
                        id: user.teacherId,
                        name: user.name,
                        role: 'principal',
                        color: user.color,
                        phone: account
                    };
                } else {
                    wx.showToast({ title: result.error || '账号或密码错误', icon: 'error' });
                    this.setData({ loggingIn: false });
                    return;
                }
            } else {
                // 老师登录：数据库验证
                const result = await db.loginTeacher(account, password);

                if (result.success) {
                    const teacher = result.teacher;
                    // 特殊逻辑：18871458537 既是老师也是校长
                    const isPrincipal = (account === '18871458537');

                    currentUser = {
                        id: teacher.teacherId,
                        name: teacher.name,
                        role: isPrincipal ? 'principal' : 'teacher',
                        color: teacher.color,
                        phone: account // 保留手机号方便后续权限判断
                    };
                } else {
                    wx.showToast({ title: result.error || '登录失败', icon: 'error' });
                    this.setData({ loggingIn: false });
                    return;
                }
            }

            // --- 记住密码逻辑优化 (多账号支持) ---
            // 1. 保存最后一次登录信息 (用于默认回显)
            wx.setStorageSync('last_login_info', {
                role: selectedRole,
                account: account,
                selectedTeacherIndex: this.data.selectedTeacherIndex
            });

            // 2. 更新密码本
            let savedPasswords = wx.getStorageSync('saved_passwords') || {};
            if (rememberPassword) {
                savedPasswords[account] = password;
            } else {
                if (savedPasswords[account]) {
                    delete savedPasswords[account];
                }
            }
            wx.setStorageSync('saved_passwords', savedPasswords);

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
