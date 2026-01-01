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

// 获取所有老师
async function getTeachers() {
    try {
        const { data } = await getDb().collection(COLLECTIONS.TEACHERS).get()
        return data
    } catch (err) {
        console.error('获取老师列表失败:', err)
        return []
    }
}

// 老师登录
async function loginTeacher(phone, password) {
    try {
        const { data } = await getDb().collection(COLLECTIONS.TEACHERS)
            .where({ phone: phone })
            .get()

        if (!data || data.length === 0) {
            return { success: false, error: '账号不存在' }
        }

        const user = data[0];
        if (user.password !== password) {
            return { success: false, error: '密码错误' }
        }

        return { success: true, teacher: user }
    } catch (err) {
        console.error('登录失败:', err)
        return { success: false, error: '登录失败，请重试' }
    }
}

// 学生/家长登录
async function loginStudent(phone, password) {
    try {
        const { data } = await getDb().collection(COLLECTIONS.STUDENTS)
            .where({ phone: phone })
            .get()

        if (!data || data.length === 0) {
            return { success: false, error: '账号不存在' }
        }

        const user = data[0];
        if (user.password !== password) {
            return { success: false, error: '密码错误' }
        }

        return { success: true, student: user }
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
        const { data } = await getDb().collection(COLLECTIONS.COURSES).doc(courseId).get()
        return data
    } catch (err) {
        console.error('获取课程详情失败:', err)
        return null
    }
}

// ==================== 学生相关 ====================

// 获取所有学生 (支持按创建者过滤)
async function getStudents(creatorId = null) {
    try {
        let query = getDb().collection(COLLECTIONS.STUDENTS);

        if (creatorId) {
            query = query.where({
                creatorId: creatorId
            });
        }

        const { data } = await query.orderBy('name', 'asc').get();
        return data
    } catch (err) {
        console.error('获取学生列表失败:', err)
        return []
    }
}

// 添加学生
async function addStudent(studentData) {
    try {
        // 0. 检查姓名唯一性
        const isUnique = await isNameUnique(studentData.name);
        if (!isUnique) {
            return { success: false, error: '该姓名已被老师或学生占用' };
        }

        const result = await getDb().collection(COLLECTIONS.STUDENTS).add({
            data: {
                ...studentData,
                createTime: getDb().serverDate()
            }
        })
        return { success: true, id: result._id }
    } catch (err) {
        console.error('添加学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 更新学生
async function updateStudent(studentId, studentData) {
    try {
        // 0. 如果修改了姓名，检查唯一性
        if (studentData.name) {
            const isUnique = await isNameUnique(studentData.name, studentId);
            if (!isUnique) {
                return { success: false, error: '该姓名已被占用' };
            }
        }

        await getDb().collection(COLLECTIONS.STUDENTS).doc(studentId).update({
            data: {
                ...studentData,
                updateTime: getDb().serverDate()
            }
        })
        return { success: true }
    } catch (err) {
        console.error('更新学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 删除学生
async function deleteStudent(studentId) {
    try {
        await getDb().collection(COLLECTIONS.STUDENTS).doc(studentId).remove()
        return { success: true }
    } catch (err) {
        console.error('删除学生失败:', err)
        return { success: false, error: err.message || err.errMsg }
    }
}

// 获取学生详情
async function getStudentById(studentId) {
    try {
        const { data } = await getDb().collection(COLLECTIONS.STUDENTS).doc(studentId).get()
        return data
    } catch (err) {
        console.error('获取学生详情失败:', err)
        return null
    }
}

/**
 * 检查姓名是否在全系统内唯一（老师和学生不能重名）
 * @param {string} name 待检查姓名
 * @param {string} excludeId 排除的ID (更新时使用)
 */
async function isNameUnique(name, excludeId = null) {
    try {
        const db = getDb();
        const cmd = getCmd();

        // 1. 在老师集合中查找
        let teacherQuery = db.collection(COLLECTIONS.TEACHERS).where({ name: name });
        if (excludeId) {
            teacherQuery = teacherQuery.where({
                _id: cmd.neq(excludeId),
                teacherId: cmd.neq(excludeId) // 兼容两种ID标识
            });
        }
        const { data: teachers } = await teacherQuery.get();
        if (teachers.length > 0) return false;

        // 2. 在学生集合中查找
        let studentQuery = db.collection(COLLECTIONS.STUDENTS).where({ name: name });
        if (excludeId) {
            studentQuery = studentQuery.where({
                _id: cmd.neq(excludeId)
            });
        }
        const { data: students } = await studentQuery.get();
        if (students.length > 0) return false;

        return true;
    } catch (err) {
        console.error('检查姓名唯一性失败:', err);
        return true;
    }
}

// 用户注册
async function registerUser(role, userData) {
    try {
        const collection = role === 'student' ? COLLECTIONS.STUDENTS : COLLECTIONS.TEACHERS;

        // 0. 检查姓名唯一性
        const isUnique = await isNameUnique(userData.name);
        if (!isUnique) {
            return { success: false, error: '该姓名已被老师或学生占用，请尝试其他名称' };
        }

        // 1. 检查账号(手机号)是否已存在
        const { data: existing } = await getDb().collection(collection)
            .where({ phone: userData.phone })
            .get();

        if (existing && existing.length > 0) {
            return { success: false, error: '账号(手机号)已被注册' };
        }

        // 2. 准备基础数据
        const dataToSave = {
            ...userData,
            createTime: getDb().serverDate()
        };

        // 如果是老师，补充 teacherId (使用手机号作为默认ID)
        if (role === 'teacher' && !dataToSave.teacherId) {
            dataToSave.teacherId = userData.phone;
        }

        // 3. 写入数据库
        const result = await getDb().collection(collection).add({
            data: dataToSave
        });

        return { success: true, id: result._id };
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
