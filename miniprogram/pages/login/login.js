// pages/login/login.js
const app = getApp();
const db = require('../../utils/db.js');

Page({
    data: {
        selectedRole: '',
        teachers: [],
        selectedTeacherIndex: -1,
        selectedTeacher: null,
        canLogin: false
    },

    onLoad() {
        this.loadTeachers();
    },

    onShow() {
        // 如果已登录，直接跳转
        if (app.globalData.isLoggedIn) {
            wx.switchTab({
                url: '/pages/schedule/schedule'
            });
        }
    },

    // 加载老师列表
    async loadTeachers() {
        wx.showLoading({ title: '加载中...' });

        try {
            // 初始化老师数据（如果还没有）
            await db.initTeachers();

            // 获取老师列表
            const teachers = await db.getTeachers();
            this.setData({ teachers });
        } catch (err) {
            console.error('加载老师列表失败:', err);
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
        } finally {
            wx.hideLoading();
        }
    },

    // 选择角色
    selectRole(e) {
        const role = e.currentTarget.dataset.role;
        this.setData({
            selectedRole: role,
            selectedTeacherIndex: -1,
            selectedTeacher: null
        });
        this.updateCanLogin();
    },

    // 选择老师
    onTeacherChange(e) {
        const index = parseInt(e.detail.value);
        const teacher = this.data.teachers[index];
        this.setData({
            selectedTeacherIndex: index,
            selectedTeacher: teacher
        });
        this.updateCanLogin();
    },

    // 更新是否可以登录
    updateCanLogin() {
        const { selectedRole, selectedTeacher } = this.data;
        let canLogin = false;

        if (selectedRole === 'principal') {
            canLogin = true;
        } else if (selectedRole === 'teacher' && selectedTeacher) {
            canLogin = true;
        }

        this.setData({ canLogin });
    },

    // 处理登录
    handleLogin() {
        const { selectedRole, selectedTeacher } = this.data;

        if (!this.data.canLogin) {
            return;
        }

        let currentUser;

        if (selectedRole === 'principal') {
            currentUser = {
                id: 'principal',
                name: '校长',
                role: 'principal'
            };
        } else {
            currentUser = {
                id: selectedTeacher.teacherId,
                name: selectedTeacher.name,
                role: 'teacher',
                color: selectedTeacher.color
            };
        }

        // 保存登录状态
        app.setCurrentUser(currentUser);

        // 跳转到排课页面
        wx.switchTab({
            url: '/pages/schedule/schedule'
        });
    }
});
