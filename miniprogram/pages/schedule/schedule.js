// pages/schedule/schedule.js
const app = getApp();
const db = require('../../utils/db.js');
const dateUtil = require('../../utils/dateUtil.js');

Page({
    data: {
        currentUser: null,
        isPrincipal: false,
        isStudent: false,
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
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 0
            })
            this.getTabBar().initByRole();
        }

        // 检查是否有外部传入的“查看特定学生课表”请求
        if (app.globalData.viewingStudent) {
            const { id, name } = app.globalData.viewingStudent;
            this.setData({
                isStudent: true, // 借用学生视图逻辑展示
                currentUser: { id, name }, // 临时替换当前查看对象
                viewingOnly: true // 标记为临时查看模式
            }, () => {
                this.loadCourses(true);
            });
            // 清理全局状态，避免下次进入受影响
            app.globalData.viewingStudent = null;
            return;
        }

        // 正常加载逻辑 (没有外部筛选时)
        if (this.data.currentUser) {
            this.loadCourses(false);
        }
    },

    // 退出“查看他人课表”模式，回到原本身份
    handleCloseViewStudent() {
        this.initData(); // 重新加载自己的数据
        this.setData({ viewingOnly: false });
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
        const isStudent = user.role === 'student';

        this.setData({
            currentUser: user,
            isPrincipal: isPrincipal,
            isStudent: isStudent
        });

        if (isPrincipal) {
            // 如果是校长，先加载老师列表，默认选择第一个老师
            await this.loadTeachers();
        } else if (isStudent) {
            // 如果是学生，直接加载自己的课程
            this.loadCourses(true);
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
        const { isStudent, currentTeacher, currentUser, weekOffset } = this.data;

        // 非学生角色必须有选中的老师
        if (!isStudent && !currentTeacher) return;

        if (showLoading) {
            wx.showLoading({ title: '加载中...' });
        }

        try {
            const { startStr, endStr } = dateUtil.getWeekRangeByOffset(weekOffset);
            let courses = [];

            if (isStudent) {
                // 学生：按学生 ID 或姓名查询
                courses = await db.getCoursesByStudent(
                    currentUser.id,
                    currentUser.name,
                    startStr,
                    endStr
                );
            } else {
                // 老师/校长：按老师 ID 查询
                courses = await db.getCoursesByTeacher(
                    currentTeacher.teacherId,
                    startStr,
                    endStr
                );
            }

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
        if (this.data.isStudent) return; // 学生不能添加

        const { date, time, dayName } = e.detail;

        // 跳转到编辑页，传递参数
        wx.navigateTo({
            url: `/pages/course-edit/course-edit?mode=add&date=${date}&time=${time}&dayName=${dayName}&teacherId=${this.data.currentTeacher.teacherId}&teacherName=${this.data.currentTeacher.name}`
        });
    },

    // 点击已有课程编辑
    onEditCourse(e) {
        if (this.data.isStudent) return; // 学生不能编辑

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
