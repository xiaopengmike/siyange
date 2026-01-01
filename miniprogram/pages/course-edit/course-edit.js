// pages/course-edit/course-edit.js
const db = require('../../utils/db.js')
const dateUtil = require('../../utils/dateUtil.js')
const app = getApp()

Page({
    data: {
        mode: 'add', // add or edit
        courseId: '',
        course: {},
        date: '',
        time: '',
        dayName: '',
        teacherId: '',
        teacherName: '',
        submitting: false,
        // 时间选择相关
        hour: '',
        minutesRange: ['00', '30'],
        minuteIndex: 0,
        duration: 60, // 分钟
        // 学生选择相关
        students: [],
        selectedStudentIndex: -1,
        selectedStudent: null
    },

    onLoad(options) {
        const { mode } = options
        this.setData({ mode })

        // 加载学生列表
        this.loadStudents()

        if (mode === 'add') {
            // 新建模式
            const { date, time, dayName, teacherId, teacherName } = options
            const hour = time.split(':')[0]
            const minute = time.split(':')[1]
            this.setData({
                date,
                time,
                hour,
                minuteIndex: minute === '30' ? 1 : 0,
                dayName,
                teacherId,
                teacherName
            })
        } else {
            // 编辑模式
            const { courseId } = options
            this.setData({ courseId })
            this.loadCourseDetail(courseId)
        }
    },

    // 加载学生列表
    async loadStudents() {
        try {
            const students = await db.getStudents()
            this.setData({ students })
        } catch (err) {
            console.error('加载学生列表失败:', err)
        }
    },

    // 加载课程详情
    async loadCourseDetail(courseId) {
        wx.showLoading({ title: '加载中...' })
        try {
            const dbInstance = wx.cloud.database()
            const { data } = await dbInstance.collection('courses').doc(courseId).get()

            // 获取周几的名称
            const dayIndex = new Date(data.date).getDay()
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

            const duration = dateUtil.timeToMinutes(data.endTime) - dateUtil.timeToMinutes(data.startTime)
            const hour = data.startTime.split(':')[0]
            const minute = data.startTime.split(':')[1]

            this.setData({
                course: data,
                date: data.date,
                time: data.startTime,
                hour,
                minuteIndex: minute === '30' ? 1 : 0,
                duration: duration > 0 ? duration : 60,
                dayName: dayNames[dayIndex],
                teacherId: data.teacherId,
                teacherName: data.teacherName
            })

            // 如果有学生ID，匹配选中的学生
            if (data.studentId) {
                const { students } = this.data
                const index = students.findIndex(s => s._id === data.studentId)
                if (index >= 0) {
                    this.setData({
                        selectedStudentIndex: index,
                        selectedStudent: students[index]
                    })
                }
            } else if (data.studentName) {
                // 兼容旧数据：通过姓名匹配
                const { students } = this.data
                const index = students.findIndex(s => s.name === data.studentName)
                if (index >= 0) {
                    this.setData({
                        selectedStudentIndex: index,
                        selectedStudent: students[index]
                    })
                }
            }
        } catch (err) {
            console.error('加载详情失败', err)
            wx.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            wx.hideLoading()
        }
    },

    // 选择学生
    onStudentChange(e) {
        const index = parseInt(e.detail.value)
        const student = this.data.students[index]
        this.setData({
            selectedStudentIndex: index,
            selectedStudent: student
        })
    },

    // 选择分钟
    onMinuteChange(e) {
        this.setData({
            minuteIndex: e.detail.value
        })
    },

    // 切换时长
    onDurationChange(e) {
        this.setData({
            duration: parseInt(e.detail.value)
        })
    },

    // 跳转添加学生
    onAddStudent() {
        wx.navigateTo({
            url: '/pages/student-edit/student-edit?mode=add'
        })
    },

    // 页面显示时刷新学生列表（从添加学生页返回）
    onShow() {
        if (this.data.students.length > 0) {
            // 已加载过，刷新一下
            this.loadStudents()
        }
    },

    // 提交表单
    async onSubmit(e) {
        const { courseName, notes } = e.detail.value
        const { selectedStudent, hour, minutesRange, minuteIndex, duration } = this.data

        if (!courseName) {
            wx.showToast({ title: '请输入课程名称', icon: 'none' })
            return
        }

        if (!selectedStudent) {
            wx.showToast({ title: '请选择学生', icon: 'none' })
            return
        }

        this.setData({ submitting: true })

        try {
            // 计算实际的起止时间
            const startTime = `${hour}:${minutesRange[minuteIndex]}`
            const startTimeMinutes = dateUtil.timeToMinutes(startTime)
            const endTimeMinutes = startTimeMinutes + duration
            const endTime = dateUtil.minutesToTime(endTimeMinutes)

            // 检查冲突
            const { hasConflict } = await db.checkTimeConflict(
                this.data.teacherId,
                this.data.date,
                startTime,
                endTime,
                this.data.mode === 'edit' ? this.data.courseId : null
            )

            if (hasConflict) {
                wx.showToast({ title: '该时段已有课程', icon: 'none' })
                this.setData({ submitting: false })
                return
            }

            // 使用学生的颜色作为课程颜色
            const color = selectedStudent.color || this.data.course.color || '#4A90D9'

            const courseData = {
                courseName,
                studentId: selectedStudent._id,
                studentName: selectedStudent.name,
                notes,
                teacherId: this.data.teacherId,
                teacherName: this.data.teacherName,
                date: this.data.date,
                startTime: startTime,
                endTime: endTime,
                color: color
            }

            let result
            if (this.data.mode === 'add') {
                result = await db.addCourse(courseData)
            } else {
                result = await db.updateCourse(this.data.courseId, courseData)
            }

            if (result.success) {
                wx.showToast({ title: '保存成功', icon: 'success' })
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
            } else {
                throw new Error('保存失败')
            }

        } catch (err) {
            console.error('保存失败', err)
            wx.showToast({ title: '保存失败，请重试', icon: 'error' })
        } finally {
            this.setData({ submitting: false })
        }
    },

    // 删除课程
    async handleDelete() {
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这门课程吗？此操作无法恢复。',
            confirmColor: '#EF5350',
            success: async (res) => {
                if (res.confirm) {
                    this.setData({ submitting: true })

                    try {
                        const result = await db.deleteCourse(this.data.courseId)
                        if (result.success) {
                            wx.showToast({ title: '已删除', icon: 'success' })
                            setTimeout(() => {
                                wx.navigateBack()
                            }, 1500)
                        } else {
                            throw new Error('删除失败')
                        }
                    } catch (err) {
                        console.error('删除失败', err)
                        wx.showToast({ title: '删除失败', icon: 'error' })
                        this.setData({ submitting: false })
                    }
                }
            }
        })
    },

    handleCancel() {
        wx.navigateBack()
    }
})
