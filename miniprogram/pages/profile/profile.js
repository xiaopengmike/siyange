// pages/profile/profile.js
const app = getApp()

Page({
    data: {
        currentUser: null,
        isPrincipal: false,
        isStudent: false,
        version: '1.0.0'
    },

    onLoad() {
        this.checkLogin()
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const user = app.globalData.currentUser;
            this.getTabBar().setData({
                selected: (user && user.role === 'student') ? 1 : 2
            })
            this.getTabBar().initByRole();
        }
        this.loadUserInfo()
    },

    // 检查登录状态
    checkLogin() {
        if (!app.globalData.currentUser) {
            wx.redirectTo({ url: '/pages/login/login' })
        }
    },

    // 加载用户信息
    loadUserInfo() {
        const currentUser = app.globalData.currentUser
        if (currentUser) {
            this.setData({
                currentUser,
                isPrincipal: currentUser.role === 'principal',
                isStudent: currentUser.role === 'student'
            })
        }
    },

    // 切换角色
    onSwitchRole() {
        wx.showModal({
            title: '切换角色',
            content: '确定要切换登录角色吗？',
            success: (res) => {
                if (res.confirm) {
                    app.logout()
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            }
        })
    },

    // 关于我们
    onAbout() {
        wx.showModal({
            title: '关于思研阁',
            content: '思研阁排课系统 v1.0.0\n\n专业的课程管理工具，帮助老师高效安排课程。',
            showCancel: false
        })
    },

    // 使用帮助
    onHelp() {
        wx.showModal({
            title: '使用帮助',
            content: '1. 点击课表空白处添加课程\n2. 点击已有课程进行编辑\n3. 左右滑动切换周视图',
            showCancel: false
        })
    },

    // 退出登录
    onLogout() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    app.logout()
                    wx.reLaunch({
                        url: '/pages/login/login'
                    })
                }
            }
        })
    }
})
