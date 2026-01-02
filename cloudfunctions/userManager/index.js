// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 集合名称
const COLLECTIONS = {
    TEACHERS: 'teachers',
    STUDENTS: 'students'
}

// 云函数入口函数
exports.main = async (event, context) => {
    const { action, data } = event
    const wxContext = cloud.getWXContext()

    try {
        switch (action) {
            case 'getTeachers':
                return await getTeachers(data)
            case 'getStudents':
                return await getStudents(data)
            case 'registerUser':
                return await registerUser(data)
            case 'addStudent':
                return await addStudent(data)
            case 'updateStudent':
                return await updateStudent(data)
            case 'deleteStudent':
                return await deleteStudent(data)
            case 'getStudentById':
                return await getStudentById(data)
            case 'checkNameUnique':
                return await checkNameUnique(data)
            default:
                return { success: false, error: '无效的操作' }
        }
    } catch (err) {
        console.error('操作失败', err)
        return { success: false, error: err.message || '系统错误' }
    }
}

// 获取老师列表
async function getTeachers(params) {
    const { role } = params || {}
    let query = {}

    // 如果指定了角色，进行筛选
    if (role === 'principal') {
        query.roles = 'principal'
    }

    const { data } = await db.collection(COLLECTIONS.TEACHERS).where(query).get()

    // 脱敏：移除密码
    const teachers = data.map(t => {
        const { password, ...rest } = t
        return rest
    })
    return { success: true, data: teachers }
}

// 获取学生列表
async function getStudents(params) {
    const { creatorId } = params || {}
    let query = db.collection(COLLECTIONS.STUDENTS)

    if (creatorId) {
        query = query.where({
            creatorId: creatorId
        })
    }

    const { data } = await query.orderBy('name', 'asc').get()

    // 脱敏
    const students = data.map(s => {
        const { password, ...rest } = s
        return rest
    })

    return { success: true, data: students }
}

// 检查姓名唯一性
async function checkNameUnique(params) {
    const { name, excludeId } = params

    // 1. 查老师
    let teacherQuery = db.collection(COLLECTIONS.TEACHERS).where({ name })
    if (excludeId) {
        teacherQuery = teacherQuery.where({
            _id: _.neq(excludeId),
            teacherId: _.neq(excludeId)
        })
    }
    const { data: teachers } = await teacherQuery.get()
    if (teachers.length > 0) return { isUnique: false }

    // 2. 查学生
    let studentQuery = db.collection(COLLECTIONS.STUDENTS).where({ name })
    if (excludeId) {
        studentQuery = studentQuery.where({
            _id: _.neq(excludeId)
        })
    }
    const { data: students } = await studentQuery.get()
    if (students.length > 0) return { isUnique: false }

    return { isUnique: true }
}

// 注册用户
async function registerUser(userData) {
    const { role, ...info } = userData
    const collectionName = (role === 'teacher' || role === 'principal') ? COLLECTIONS.TEACHERS : COLLECTIONS.STUDENTS

    // 0. 检查姓名唯一
    const { isUnique } = await checkNameUnique({ name: info.name })
    if (!isUnique) {
        return { success: false, error: '该姓名已被占用' }
    }

    // 1. 检查账号
    const { data: existing } = await db.collection(collectionName).where({ phone: info.phone }).get()
    if (existing.length > 0) {
        return { success: false, error: '账号(手机号)已被注册' }
    }

    // 2. 准备数据
    const dataToSave = {
        ...info,
        createTime: db.serverDate()
    }
    if (role === 'teacher' && !dataToSave.teacherId) {
        dataToSave.teacherId = info.phone
    }

    // 3. 写入
    const result = await db.collection(collectionName).add({ data: dataToSave })
    return { success: true, id: result._id }
}

// 添加学生
async function addStudent(studentData) {
    // 0. 检查姓名唯一
    const { isUnique } = await checkNameUnique({ name: studentData.name })
    if (!isUnique) {
        return { success: false, error: '该姓名已被占用' }
    }

    const result = await db.collection(COLLECTIONS.STUDENTS).add({
        data: {
            ...studentData,
            createTime: db.serverDate()
        }
    })
    return { success: true, id: result._id }
}

// 更新学生
async function updateStudent(params) {
    const { studentId, ...data } = params

    // 0. 检查姓名唯一
    if (data.name) {
        const { isUnique } = await checkNameUnique({ name: data.name, excludeId: studentId })
        if (!isUnique) {
            return { success: false, error: '该姓名已被占用' }
        }
    }

    await db.collection(COLLECTIONS.STUDENTS).doc(studentId).update({
        data: {
            ...data,
            updateTime: db.serverDate()
        }
    })
    return { success: true }
}

// 删除学生
async function deleteStudent(params) {
    const { studentId } = params
    await db.collection(COLLECTIONS.STUDENTS).doc(studentId).remove()
    return { success: true }
}

// 获取学生详情
async function getStudentById(params) {
    const { studentId } = params
    try {
        const { data } = await db.collection(COLLECTIONS.STUDENTS).doc(studentId).get()
        return { success: true, data }
    } catch (err) {
        console.error('获取学生详情失败:', err)
        return { success: false, error: err.message || '获取详情失败' }
    }
}
