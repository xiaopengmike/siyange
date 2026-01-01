// utils/dateUtil.js - 日期工具函数

// 获取本周的日期范围
function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一开始

    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
        start: monday,
        end: sunday,
        startStr: formatDate(monday),
        endStr: formatDate(sunday)
    };
}

// 获取指定周偏移量的日期范围
function getWeekRangeByOffset(offset = 0) {
    const today = new Date();
    today.setDate(today.getDate() + offset * 7);
    return getWeekRange(today);
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取一周的日期数组
function getWeekDays(weekOffset = 0) {
    const { start } = getWeekRangeByOffset(weekOffset);
    const days = [];
    const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push({
            date: formatDate(date),
            dayOfWeek: i + 1,
            dayName: weekDayNames[i],
            dayNum: date.getDate(),
            month: date.getMonth() + 1,
            isToday: formatDate(date) === formatDate(new Date())
        });
    }

    return days;
}

// 生成时间段列表 (1小时粒度)
function getTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
        slots.push({
            time: `${String(hour).padStart(2, '0')}:00`,
            hour: hour,
            minute: 0,
            value: hour * 60
        });
    }
    return slots;
}

// 时间字符串转分钟数
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 分钟数转时间字符串
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 获取周的显示文本
function getWeekDisplayText(weekOffset) {
    if (weekOffset === 0) return '本周';
    if (weekOffset === 1) return '下周';
    if (weekOffset === -1) return '上周';

    const { start, end } = getWeekRangeByOffset(weekOffset);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

module.exports = {
    getWeekRange,
    getWeekRangeByOffset,
    formatDate,
    getWeekDays,
    getTimeSlots,
    timeToMinutes,
    minutesToTime,
    getWeekDisplayText
};
