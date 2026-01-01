// pages/schedule/schedule.js
const app = getApp();
const db = require('../../utils/db.js');
const dateUtil = require('../../utils/dateUtil.js');

Page({
    data: {
        currentUser: null,
        isPrincipal: false,
        currentTeacher: null, // 当前查看的老师（可能是自己，也可能是校长选择的）
        weekOffset: 0,
        weekDisplayText: '本周',
        courses: [],
        teachers: [] // 供校长选择
    },

    onLoad() {
        this.initData();
    },

    onShow() {
        // 每次显示页面都重新加载课程，确保数据最新
        // 使用静默加载，避免闪屏
        if (this.data.currentTeacher) {
            this.loadCourses(false);
        }
    },

    onPullDownRefresh() {
        this.loadCourses(false);
        setTimeout(() => {
            wx.stopPullDownRefresh();
        }, 1000);
    },

    // 初始化数据
    async initData() {
        const user = app.globalData.currentUser;
        if (!user) {
            wx.redirectTo({ url: '/pages/login/login' });
            return;
        }

        const isPrincipal = user.role === 'principal';

        this.setData({
            currentUser: user,
            isPrincipal: isPrincipal
        });

        if (isPrincipal) {
            // 如果是校长，先加载老师列表，默认选择第一个老师
            await this.loadTeachers();
        } else {
            // 如果是老师，直接设置为当前老师
            this.setData({
                currentTeacher: {
                    teacherId: user.id,
                    name: user.name,
                    color: user.color
                }
            });
            this.loadCourses(true);
        }
    },

    // 加载老师列表（校长用）
    async loadTeachers() {
        try {
            const teachers = await db.getTeachers();
            if (teachers && teachers.length > 0) {
                this.setData({
                    teachers,
                    currentTeacher: teachers[0]
                });
                this.loadCourses(true);
            }
        } catch (err) {
            console.error('加载老师列表失败', err);
        }
    },

    // 加载课程数据
    async loadCourses(showLoading = true) {
        if (!this.data.currentTeacher) return;

        if (showLoading) {
            wx.showLoading({ title: '加载中...' });
        }

        try {
            const { startStr, endStr } = dateUtil.getWeekRangeByOffset(this.data.weekOffset);

            const courses = await db.getCoursesByTeacher(
                this.data.currentTeacher.teacherId,
                startStr,
                endStr
            );

            this.setData({ courses });

        } catch (err) {
            console.error('加载课程失败', err);
            if (showLoading) {
                wx.showToast({ title: '加载失败', icon: 'error' });
            }
        } finally {
            if (showLoading) {
                wx.hideLoading();
            }
        }
    },

    // 切换周
    prevWeek() {
        this.changeWeek(-1);
    },

    nextWeek() {
        this.changeWeek(1);
    },

    goToday() {
        this.setData({
            weekOffset: 0,
            weekDisplayText: dateUtil.getWeekDisplayText(0)
        });
        this.loadCourses();
    },

    changeWeek(delta) {
        const newOffset = this.data.weekOffset + delta;
        this.setData({
            weekOffset: newOffset,
            weekDisplayText: dateUtil.getWeekDisplayText(newOffset)
        });
        this.loadCourses();
    },

    // 校长切换老师
    showTeacherSelector() {
        if (!this.data.isPrincipal) return;

        const teacherNames = this.data.teachers.map(t => t.name);

        wx.showActionSheet({
            itemList: teacherNames,
            success: (res) => {
                const selectedTeacher = this.data.teachers[res.tapIndex];
                this.setData({
                    currentTeacher: selectedTeacher
                });
                this.loadCourses();
            }
        });
    },

    // 点击空白处添加课程
    onAddCourse(e) {
        const { date, time, dayName } = e.detail;

        // 跳转到编辑页，传递参数
        wx.navigateTo({
            url: `/pages/course-edit/course-edit?mode=add&date=${date}&time=${time}&dayName=${dayName}&teacherId=${this.data.currentTeacher.teacherId}&teacherName=${this.data.currentTeacher.name}`
        });
    },

    // 点击已有课程编辑
    onEditCourse(e) {
        const { course } = e.detail;

        // 跳转到编辑页
        wx.navigateTo({
            url: `/pages/course-edit/course-edit?mode=edit&courseId=${course._id}`
        });
    },

    // 退出登录
    handleLogout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    app.logout();
                    wx.reLaunch({
                        url: '/pages/login/login'
                    });
                }
            }
        });
    }
});
