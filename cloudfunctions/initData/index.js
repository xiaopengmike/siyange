// 云函数入口文件 - 初始化老师数据
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 默认老师数据
const DEFAULT_TEACHERS = [
    { teacherId: 'teacher_001', name: 'Judy老师', color: '#4A90D9', phone: '18871458537', password: '18871458537', roles: ['principal', 'teacher'] },
    { teacherId: 'teacher_002', name: 'Michael老师', color: '#66BB6A', phone: '17665388809', password: '17665388809', roles: ['teacher'] },
    { teacherId: 'teacher_003', name: '肖老师', color: '#FF7043', phone: '17665388810', password: '17665388810', roles: ['teacher'] }
]

// 默认学生数据
const DEFAULT_STUDENTS = [
    {
        studentId: 'student_001',
        name: 'Siyi Xiao',
        phone: '17665388810',
        password: '17665388810',
        color: '#FFD700',
        creatorId: '18871458537' // 默认归属 Judy老师
    }
]

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    try {
        const teachersCollection = db.collection('teachers')
        const studentsCollection = db.collection('students')
        const results = { teachers: [], students: [] }

        // 1. 遍历更新或添加老师
        for (const teacher of DEFAULT_TEACHERS) {
            const checkRes = await teachersCollection.where({
                teacherId: teacher.teacherId
            }).get()

            if (checkRes.data.length > 0) {
                const docId = checkRes.data[0]._id
                await teachersCollection.doc(docId).update({
                    data: {
                        name: teacher.name,
                        phone: teacher.phone,
                        password: teacher.password,
                        color: teacher.color,
                        roles: teacher.roles // 更新权限
                    }
                })
                results.teachers.push({ action: 'update', teacherId: teacher.teacherId })
            } else {
                await teachersCollection.add({
                    data: {
                        ...teacher,
                        createTime: db.serverDate()
                    }
                })
                results.teachers.push({ action: 'add', teacherId: teacher.teacherId })
            }
        }

        // 2. 清理不在预设列表中的老师 (强力清理模式)
        // 获取当前数据库中所有老师记录 (假设数量不超过100)
        const { data: allCurrentTeachers } = await teachersCollection.limit(100).get()
        const validTeacherIds = DEFAULT_TEACHERS.map(t => t.teacherId)

        const idsToDelete = []
        for (const t of allCurrentTeachers) {
            // 如果没有 teacherId 或者是无效的 teacherId，则删除
            if (!t.teacherId || !validTeacherIds.includes(t.teacherId)) {
                idsToDelete.push(t._id)
            }
        }

        if (idsToDelete.length > 0) {
            const deleteRes = await teachersCollection.where({
                _id: db.command.in(idsToDelete)
            }).remove()
            results.teachers_deleted = deleteRes.stats.removed
        } else {
            results.teachers_deleted = 0
        }

        // 3. 遍历更新或添加学生
        for (const student of DEFAULT_STUDENTS) {
            const checkRes = await studentsCollection.where({
                name: student.name
            }).get()

            if (checkRes.data.length > 0) {
                const docId = checkRes.data[0]._id
                await studentsCollection.doc(docId).update({
                    data: {
                        phone: student.phone,
                        password: student.password,
                        studentId: student.studentId,
                        creatorId: student.creatorId
                    }
                })
                results.students.push({ action: 'update', name: student.name })
            } else {
                await studentsCollection.add({
                    data: {
                        ...student,
                        createTime: db.serverDate()
                    }
                })
                results.students.push({ action: 'add', name: student.name })
            }
        }

        return {
            success: true,
            message: '同步数据完成',
            results,
            openid: wxContext.OPENID
        }
    } catch (err) {
        console.error('初始化失败:', err)
        return {
            success: false,
            error: err.message || err.errMsg,
            openid: wxContext.OPENID
        }
    }
}
