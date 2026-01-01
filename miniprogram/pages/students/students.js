// pages/students/students.js
const app = getApp()
const db = require('../../utils/db.js')

Page({
    data: {
        isStudent: false,
        items: [], // 通用的数据项（老师或学生）
        filteredItems: [],
        searchText: '',
        loading: false
    },

    onLoad() {
        this.checkLogin()
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 1 // 在老师视角是第2项，在学生视角此页面不在Tab
            })
            this.getTabBar().initByRole();
        }
        this.loadData()
    },

    // 检查登录状态
    checkLogin() {
        const user = app.globalData.currentUser;
        if (!user) {
            wx.redirectTo({ url: '/pages/login/login' })
            return;
        }
        this.setData({
            isStudent: user.role === 'student'
        });
    },

    // 加载数据
    async loadData() {
        this.setData({ loading: true })
        const { isStudent } = this.data
        const currentUser = app.globalData.currentUser

        try {
            let items = []
            if (isStudent) {
                items = await db.getTeachers()
            } else {
                const isPrincipal = currentUser && currentUser.role === 'principal'
                const creatorId = isPrincipal ? null : (currentUser.teacherId || currentUser.phone || currentUser._id)
                items = await db.getStudents(creatorId)
            }

            this.setData({
                items,
                filteredItems: items
            })
        } catch (err) {
            console.error('加载数据失败:', err)
            wx.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            this.setData({ loading: false })
        }
    },

    // 搜索
    onSearchInput(e) {
        const searchText = e.detail.value.trim().toLowerCase()
        this.setData({ searchText })

        if (!searchText) {
            this.setData({ filteredItems: this.data.items })
            return
        }

        const filteredItems = this.data.items.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchText);
            const phoneMatch = item.phone && item.phone.includes(searchText);
            const parentMatch = item.parentName && item.parentName.toLowerCase().includes(searchText);
            return nameMatch || phoneMatch || parentMatch;
        })

        this.setData({ filteredItems })
    },

    // 清空搜索
    onClearSearch() {
        this.setData({
            searchText: '',
            filteredItems: this.data.items
        })
    },

    // 添加学生 (老师可用)
    onAddStudent() {
        if (this.data.isStudent) return;
        wx.navigateTo({
            url: '/pages/student-edit/student-edit?mode=add'
        })
    },

    // 查看/编辑详情
    onStudentTap(e) {
        if (this.data.isStudent) return; // 学生暂不能查看老师详情页

        const { id } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/student-edit/student-edit?mode=edit&studentId=${id}`
        })
    },

    // 跳转查看学生课表
    onViewSchedule(e) {
        const { id, name } = e.currentTarget.dataset;
        // 将目标学生信息存入全局，以便 schedule 页面读取
        app.globalData.viewingStudent = { id, name };
        wx.switchTab({
            url: '/pages/schedule/schedule'
        });
    },

    // 拨打电话
    onCallPhone(e) {
        const { phone } = e.currentTarget.dataset
        if (phone) {
            wx.makePhoneCall({
                phoneNumber: phone,
                fail: () => { }
            })
        }
    },

    // 下拉刷新
    async onPullDownRefresh() {
        await this.loadData()
        wx.stopPullDownRefresh()
    }
})
