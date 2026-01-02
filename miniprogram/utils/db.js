// utils/db.js - 云开发数据库工具函数

// 延迟初始化数据库，避免在 wx.cloud.init() 之前调用
let _db = null
let _cmd = null

function getDb() {
    if (!_db) {
        _db = wx.cloud.database()
        _cmd = _db.command
    }
    return _db
}

function getCmd() {
    if (!_cmd) {
        getDb()
    }
    return _cmd
}

// 集合名称
const COLLECTIONS = {
    TEACHERS: 'teachers',
    COURSES: 'courses',
    STUDENTS: 'students'
}

// ==================== 老师相关 ====================

// ==================== 老师相关 ====================

// 初始化老师数据（调用云函数）
async function initTeachers() {
    try {
        const result = await wx.cloud.callFunction({
            name: 'initData'
        })
        console.log('初始化老师数据结果:', result.result)
        return result.result
    } catch (err) {
        console.error('初始化老师数据失败:', err)
        return { success: false, error: err }
    }
}

// 获取所有老师 (支持角色筛选)
async function getTeachers(role) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'getTeachers',
                data: { role }
            }
        })
        return result.result.success ? result.result.data : []
    } catch (err) {
        console.error('获取老师列表失败:', err)
        return []
    }
}

// 老师登录
async function loginTeacher(phone, password) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'login',
            data: {
                role: 'teacher',
                account: phone,
                password: password
            }
        })
        return result.result
    } catch (err) {
        console.error('登录失败:', err)
        return { success: false, error: '登录失败，请重试' }
    }
}

// 学生/家长登录
async function loginStudent(phone, password) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'login',
            data: {
                role: 'student',
                account: phone,
                password: password
            }
        })
        // 适配返回结构
        return result.result
    } catch (err) {
        console.error('登录失败:', err)
        return { success: false, error: '登录失败，请重试' }
    }
}

// ==================== 课程相关 (使用云函数) ====================

// 根据老师ID和日期范围获取课程
async function getCoursesByTeacher(teacherId, startDate, endDate) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'getByTeacher',
                data: {
                    teacherId,
                    startDate,
                    endDate
                }
            }
        })

        if (result.result && result.result.success) {
            return result.result.data
        }
        return []
    } catch (err) {
        console.error('获取课程失败:', err)
        return []
    }
}

// 根据学生ID/姓名和日期范围获取课程
async function getCoursesByStudent(studentId, studentName, startDate, endDate) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'getByStudent',
                data: {
                    studentId,
                    studentName,
                    startDate,
                    endDate
                }
            }
        })

        if (result.result && result.result.success) {
            return result.result.data
        }
        return []
    } catch (err) {
        console.error('获取学生课程失败:', err)
        return []
    }
}

// 获取指定日期范围内所有课程（校长视图）
async function getAllCourses(startDate, endDate) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'getAll',
                data: {
                    startDate,
                    endDate
                }
            }
        })

        if (result.result && result.result.success) {
            return result.result.data
        }
        return []
    } catch (err) {
        console.error('获取所有课程失败:', err)
        return []
    }
}

// 添加课程
async function addCourse(courseData) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'add',
                data: courseData
            }
        })

        return result.result || { success: false, error: '未知错误' }
    } catch (err) {
        console.error('添加课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 更新课程
async function updateCourse(courseId, courseData) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'update',
                data: {
                    courseId,
                    ...courseData
                }
            }
        })

        return result.result || { success: false, error: '未知错误' }
    } catch (err) {
        console.error('更新课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 删除课程
async function deleteCourse(courseId) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'delete',
                data: { courseId }
            }
        })

        return result.result || { success: false, error: '未知错误' }
    } catch (err) {
        console.error('删除课程失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 检查时间冲突
async function checkTimeConflict(teacherId, date, startTime, endTime, excludeCourseId = null) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'checkConflict',
                data: {
                    teacherId,
                    date,
                    startTime,
                    endTime,
                    excludeCourseId
                }
            }
        })

        return result.result || { hasConflict: false }
    } catch (err) {
        console.error('检查时间冲突失败:', err)
        return { hasConflict: false }
    }
}

// 根据课程ID获取课程详情
async function getCourseById(courseId) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'courseManager',
            data: {
                action: 'getById',
                data: { courseId }
            }
        })
        return result.result.success ? result.result.data : null
    } catch (err) {
        console.error('获取课程详情失败:', err)
        return null
    }
}

// ==================== 学生相关 ====================

// 获取所有学生 (支持按创建者过滤)
async function getStudents(creatorId = null) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'getStudents',
                data: { creatorId }
            }
        })
        return result.result.success ? result.result.data : []
    } catch (err) {
        console.error('获取学生列表失败:', err)
        return []
    }
}

// 添加学生
async function addStudent(studentData) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'addStudent',
                data: studentData
            }
        })
        return result.result
    } catch (err) {
        console.error('添加学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 更新学生
async function updateStudent(studentId, studentData) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'updateStudent',
                data: {
                    studentId,
                    ...studentData
                }
            }
        })
        return result.result
    } catch (err) {
        console.error('更新学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 删除学生
async function deleteStudent(studentId) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'deleteStudent',
                data: { studentId }
            }
        })
        return result.result
    } catch (err) {
        console.error('删除学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 获取学生详情
async function getStudentById(studentId) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'getStudentById',
                data: { studentId }
            }
        })
        return result.result.success ? result.result.data : null
    } catch (err) {
        console.error('获取学生详情失败:', err)
        return null
    }
}

/**
 * 检查姓名是否在全系统内唯一（老师和学生不能重名）
 */
async function isNameUnique(name, excludeId = null) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'checkNameUnique',
                data: { name, excludeId }
            }
        })
        return result.result.isUnique
    } catch (err) {
        console.error('检查姓名唯一性失败:', err);
        return true;
    }
}

// 用户注册
async function registerUser(role, userData) {
    try {
        const result = await wx.cloud.callFunction({
            name: 'userManager',
            data: {
                action: 'registerUser',
                data: { role, ...userData }
            }
        })
        return result.result
    } catch (err) {
        console.error('注册失败:', err);
        return { success: false, error: err.message || '注册失败，请重试' };
    }
}

module.exports = {
    COLLECTIONS,
    initTeachers,
    getTeachers,
    loginTeacher,
    loginStudent,
    getCoursesByTeacher,
    getCoursesByStudent,
    getAllCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    checkTimeConflict,
    getCourseById,
    // 学生相关
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    registerUser,
    isNameUnique
}
