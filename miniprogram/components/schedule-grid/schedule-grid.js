// components/schedule-grid/schedule-grid.js
const dateUtil = require('../../utils/dateUtil.js');

Component({
    properties: {
        // 课程数据
        courses: {
            type: Array,
            value: []
        },
        // 周偏移量
        weekOffset: {
            type: Number,
            value: 0
        },
        // 当前选中的老师ID (校长视图用)
        selectedTeacherId: {
            type: String,
            value: ''
        },
        // 当前查看的角色 (teacher/student)
        viewingRole: {
            type: String,
            value: 'teacher'
        }
    },

    data: {
        weekDays: [],
        timeSlots: [],
        scrollLeft: 0,
        coursesByDay: {} // 按日期分组的课程 { '2023-01-01': [course1, course2] }
    },

    observers: {
        'weekOffset': function (weekOffset) {
            this.updateWeekDays();
        },
        'courses': function (courses) {
            this.processCourses();
        }
    },

    lifetimes: {
        attached() {
            this.setData({
                timeSlots: dateUtil.getTimeSlots()
            });
            this.updateWeekDays();
        }
    },

    methods: {
        // 更新周日期
        updateWeekDays() {
            const weekDays = dateUtil.getWeekDays(this.data.weekOffset);
            this.setData({ weekDays });
            // 日期更新后重新处理课程
            if (this.data.courses.length > 0) {
                this.processCourses();
            }
        },

        // 处理课程数据：按天分组并计算样式
        processCourses() {
            const courses = this.data.courses || [];
            const coursesByDay = {};

            // 每天的日程范围：8:00 - 23:00 (15小时 = 900分钟)
            const START_HOUR = 8;
            const DAY_DURATION_MINUTES = 15 * 60; // 15小时

            courses.forEach(course => {
                const date = course.date;
                if (!coursesByDay[date]) {
                    coursesByDay[date] = [];
                }

                // 计算位置和高度
                const startMinutes = dateUtil.timeToMinutes(course.startTime);
                const endMinutes = dateUtil.timeToMinutes(course.endTime);

                // 相对于 8:00 的偏移量
                const offsetMinutes = startMinutes - (START_HOUR * 60);
                const durationMinutes = endMinutes - startMinutes;

                // 转换为百分比
                const top = (offsetMinutes / DAY_DURATION_MINUTES) * 100;
                const height = (durationMinutes / DAY_DURATION_MINUTES) * 100;

                coursesByDay[date].push({
                    ...course,
                    style: `top: ${top}%; height: ${height}%;`
                });
            });

            this.setData({ coursesByDay });
        },

        // 获取单元格样式类
        getCellClass(date, time) {
            const classes = [];

            // 检查是否是今天
            const today = dateUtil.formatDate(new Date());
            if (date === today) {
                classes.push('today-column');
            }

            // 检查是否已过去
            const now = new Date();
            const cellDate = new Date(date + 'T' + time + ':00');
            if (cellDate < now) {
                classes.push('past');
            }

            return classes.join(' ');
        },

        // 点击空白单元格
        onCellTap(e) {
            const { date, time, dayName } = e.currentTarget.dataset;

            this.triggerEvent('cellTap', {
                date,
                time,
                dayName
            });
        },

        // 点击课程
        onCourseTap(e) {
            const course = e.currentTarget.dataset.course;
            this.triggerEvent('courseTap', { course });
        }
    }
});
