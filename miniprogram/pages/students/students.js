// pages/students/students.js
const app = getApp()
const db = require('../../utils/db.js')

Page({
    data: {
        students: [],
        filteredStudents: [],
        searchText: '',
        loading: false
    },

    onLoad() {
        this.checkLogin()
    },

    onShow() {
        this.loadStudents()
    },

    // 检查登录状态
    checkLogin() {
        if (!app.globalData.currentUser) {
            wx.redirectTo({ url: '/pages/login/login' })
        }
    },

    // 加载学生列表
    async loadStudents() {
        this.setData({ loading: true })

        try {
            const students = await db.getStudents()
            this.setData({
                students,
                filteredStudents: students
            })
        } catch (err) {
            console.error('加载学生失败:', err)
            wx.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            this.setData({ loading: false })
        }
    },

    // 搜索学生
    onSearchInput(e) {
        const searchText = e.detail.value.trim().toLowerCase()
        this.setData({ searchText })

        if (!searchText) {
            this.setData({ filteredStudents: this.data.students })
            return
        }

        const filteredStudents = this.data.students.filter(student => {
            return student.name.toLowerCase().includes(searchText) ||
                (student.phone && student.phone.includes(searchText)) ||
                (student.parentName && student.parentName.toLowerCase().includes(searchText))
        })

        this.setData({ filteredStudents })
    },

    // 清空搜索
    onClearSearch() {
        this.setData({
            searchText: '',
            filteredStudents: this.data.students
        })
    },

    // 添加学生
    onAddStudent() {
        wx.navigateTo({
            url: '/pages/student-edit/student-edit?mode=add'
        })
    },

    // 查看/编辑学生详情
    onStudentTap(e) {
        const { id } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/student-edit/student-edit?mode=edit&studentId=${id}`
        })
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
    onPullDownRefresh() {
        this.loadStudents().then(() => {
            wx.stopPullDownRefresh()
        })
    }
})
