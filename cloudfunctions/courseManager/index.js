// 云函数入口文件 - 课程管理
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const { action, data } = event

    switch (action) {
        case 'add':
            return addCourse(data, wxContext.OPENID)
        case 'update':
            return updateCourse(data)
        case 'delete':
            return deleteCourse(data)
        case 'getByTeacher':
            return getCoursesByTeacher(data)
        case 'getByStudent':
            return getCoursesByStudent(data)
        case 'getAll':
            return getAllCourses(data)
        case 'checkConflict':
            return checkTimeConflict(data)
        default:
            return { success: false, error: '未知操作' }
    }
}

// 获取学生的课程
async function getCoursesByStudent(data) {
    const { studentId, studentName, startDate, endDate } = data

    try {
        // 使用 _.or 同时匹配 ID 或 姓名 (兼容新旧数据)
        const query = {
            date: _.gte(startDate).and(_.lte(endDate)),
            $or: [
                { studentId: studentId },
                { studentName: studentName }
            ]
        }

        // 注意：在云开发中，_.or 也可以这样写，或者使用 MongoDB 原生 $or
        const finalQuery = {
            date: _.gte(startDate).and(_.lte(endDate)),
            _id: _.exists(true) // 占位符
        }

        const { data: courses } = await db.collection('courses')
            .where(_.and([
                { date: _.gte(startDate).and(_.lte(endDate)) },
                _.or([
                    { studentId: studentId },
                    { studentName: studentName }
                ])
            ]))
            .orderBy('date', 'asc')
            .orderBy('startTime', 'asc')
            .get()

        return { success: true, data: courses }
    } catch (err) {
        console.error('获取学生课程失败:', err)
        return { success: false, error: err.message || err.errMsg, data: [] }
    }
}

// 添加课程
async function addCourse(courseData, openid) {
    try {
        // 先检查时间冲突
        const conflictResult = await checkTimeConflict({
            teacherId: courseData.teacherId,
            date: courseData.date,
            startTime: courseData.startTime,
            endTime: courseData.endTime
        })

        if (conflictResult.hasConflict) {
            return {
                success: false,
                error: '该时间段已有课程安排',
                conflictCourse: conflictResult.conflictCourse
            }
        }

        const result = await db.collection('courses').add({
            data: {
                ...courseData,
                _openid: openid,
                createTime: db.serverDate(),
                updateTime: db.serverDate()
            }
        })

        return { success: true, id: result._id }
    } catch (err) {
        console.error('添加课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 更新课程
async function updateCourse(data) {
    const { courseId, ...courseData } = data

    try {
        // 先检查时间冲突（排除当前课程）
        const conflictResult = await checkTimeConflict({
            teacherId: courseData.teacherId,
            date: courseData.date,
            startTime: courseData.startTime,
            endTime: courseData.endTime,
            excludeCourseId: courseId
        })

        if (conflictResult.hasConflict) {
            return {
                success: false,
                error: '该时间段已有课程安排',
                conflictCourse: conflictResult.conflictCourse
            }
        }

        await db.collection('courses').doc(courseId).update({
            data: {
                ...courseData,
                updateTime: db.serverDate()
            }
        })

        return { success: true }
    } catch (err) {
        console.error('更新课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 删除课程
async function deleteCourse(data) {
    const { courseId } = data

    try {
        await db.collection('courses').doc(courseId).remove()
        return { success: true }
    } catch (err) {
        console.error('删除课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 获取老师的课程
async function getCoursesByTeacher(data) {
    const { teacherId, startDate, endDate } = data

    try {
        const { data: courses } = await db.collection('courses')
            .where({
                teacherId: teacherId,
                date: _.gte(startDate).and(_.lte(endDate))
            })
            .orderBy('date', 'asc')
            .orderBy('startTime', 'asc')
            .get()

        return { success: true, data: courses }
    } catch (err) {
        console.error('获取课程失败:', err)
        return { success: false, error: err.message || err.errMsg, data: [] }
    }
}

// 获取所有课程
async function getAllCourses(data) {
    const { startDate, endDate } = data

    try {
        const { data: courses } = await db.collection('courses')
            .where({
                date: _.gte(startDate).and(_.lte(endDate))
            })
            .orderBy('date', 'asc')
            .orderBy('startTime', 'asc')
            .get()

        return { success: true, data: courses }
    } catch (err) {
        console.error('获取所有课程失败:', err)
        return { success: false, error: err.message || err.errMsg, data: [] }
    }
}

// 检查时间冲突
async function checkTimeConflict(data) {
    const { teacherId, date, startTime, endTime, excludeCourseId } = data

    try {
        let query = {
            teacherId: teacherId,
            date: date
        }

        if (excludeCourseId) {
            query._id = _.neq(excludeCourseId)
        }

        const { data: courses } = await db.collection('courses').where(query).get()

        // 检查是否有时间重叠
        for (const course of courses) {
            const courseStart = course.startTime
            const courseEnd = course.endTime

            // 时间重叠判断：新时间段的开始在已有课程结束之前，且新时间段的结束在已有课程开始之后
            if (!(endTime <= courseStart || startTime >= courseEnd)) {
                return { hasConflict: true, conflictCourse: course }
            }
        }

        return { hasConflict: false }
    } catch (err) {
        console.error('检查时间冲突失败:', err)
        return { hasConflict: false }
    }
}
