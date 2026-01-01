// pages/student-edit/student-edit.js
const app = getApp()
const db = require('../../utils/db.js')

// 预设颜色
const COLORS = [
    '#4A90D9', '#66BB6A', '#FF7043', '#AB47BC',
    '#26A69A', '#FFA726', '#EC407A', '#7E57C2',
    '#42A5F5', '#9CCC65'
]

Page({
    data: {
        mode: 'add', // add 或 edit
        studentId: '',
        student: {
            name: '',
            parentName: '',
            notes: '',
            color: '#4A90D9'
        },
        colors: COLORS,
        selectedColorIndex: 0,
        submitting: false
    },

    onLoad(options) {
        const { mode, studentId } = options

        if (mode === 'edit' && studentId) {
            this.setData({ mode, studentId })
            this.loadStudent(studentId)
            wx.setNavigationBarTitle({ title: '编辑学生' })
        } else {
            this.setData({ mode: 'add' })
            wx.setNavigationBarTitle({ title: '添加学生' })
        }
    },

    // 加载学生信息
    async loadStudent(studentId) {
        wx.showLoading({ title: '加载中...' })

        try {
            const student = await db.getStudentById(studentId)
            if (student) {
                const colorIndex = COLORS.indexOf(student.color)
                this.setData({
                    student,
                    selectedColorIndex: colorIndex >= 0 ? colorIndex : 0
                })
            }
        } catch (err) {
            console.error('加载学生失败:', err)
            wx.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            wx.hideLoading()
        }
    },

    // 输入姓名
    onNameInput(e) {
        this.setData({ 'student.name': e.detail.value })
    },

    // 输入家长姓名
    onParentNameInput(e) {
        this.setData({ 'student.parentName': e.detail.value })
    },

    // 输入备注
    onNotesInput(e) {
        this.setData({ 'student.notes': e.detail.value })
    },

    // 选择颜色
    onColorSelect(e) {
        const index = e.currentTarget.dataset.index
        this.setData({
            selectedColorIndex: index,
            'student.color': COLORS[index]
        })
    },

    // 表单验证
    validateForm() {
        const { name } = this.data.student

        if (!name || !name.trim()) {
            wx.showToast({ title: '请输入学生姓名', icon: 'none' })
            return false
        }

        return true
    },

    // 提交表单
    async onSubmit() {
        if (!this.validateForm()) return
        if (this.data.submitting) return

        this.setData({ submitting: true })
        wx.showLoading({ title: '保存中...' })

        try {
            const { mode, studentId, student } = this.data
            let result

            if (mode === 'add') {
                const currentUser = app.globalData.currentUser;
                student.creatorId = currentUser.teacherId || currentUser.phone || currentUser._id;
                result = await db.addStudent(student)
            } else {
                result = await db.updateStudent(studentId, student)
            }

            if (result.success) {
                wx.showToast({ title: '保存成功', icon: 'success' })
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
            } else {
                wx.showToast({ title: result.error || '保存失败', icon: 'error' })
            }
        } catch (err) {
            console.error('保存学生失败:', err)
            wx.showToast({ title: '保存失败', icon: 'error' })
        } finally {
            this.setData({ submitting: false })
            wx.hideLoading()
        }
    },

    // 删除学生
    async handleDelete() {
        const { studentId } = this.data

        wx.showModal({
            title: '确认删除',
            content: '确定要删除该学生吗？此操作不可恢复。',
            confirmColor: '#ff4d4f',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '删除中...' })

                    try {
                        const result = await db.deleteStudent(studentId)

                        if (result.success) {
                            wx.showToast({ title: '删除成功', icon: 'success' })
                            setTimeout(() => {
                                wx.navigateBack()
                            }, 1500)
                        } else {
                            wx.showToast({ title: '删除失败', icon: 'error' })
                        }
                    } catch (err) {
                        console.error('删除学生失败:', err)
                        wx.showToast({ title: '删除失败', icon: 'error' })
                    } finally {
                        wx.hideLoading()
                    }
                }
            }
        })
    },

    // 取消
    handleCancel() {
        wx.navigateBack()
    }
})
