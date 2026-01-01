// 云函数入口文件 - 初始化老师数据
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 默认老师数据
const DEFAULT_TEACHERS = [
    { teacherId: 'teacher_001', name: 'Judy老师', color: '#4A90D9', phone: '18871458537', password: '18871458537' },
    { teacherId: 'teacher_002', name: '某英语老师', color: '#66BB6A', phone: '123456', password: '123456' },
    { teacherId: 'teacher_003', name: '王老师', color: '#FF7043', phone: '123456', password: '123456' },
    { teacherId: 'teacher_004', name: '李老师', color: '#AB47BC', phone: '123456', password: '123456' }
]

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    try {
        const teachersCollection = db.collection('teachers')
        const results = []

        // 遍历更新或添加老师
        for (const teacher of DEFAULT_TEACHERS) {
            // 检查老师是否存在
            const checkRes = await teachersCollection.where({
                teacherId: teacher.teacherId
            }).get()

            if (checkRes.data.length > 0) {
                // 更新现有老师 (添加 phone 和 password)
                const docId = checkRes.data[0]._id
                await teachersCollection.doc(docId).update({
                    data: {
                        phone: teacher.phone,
                        password: teacher.password
                    }
                })
                results.push({ action: 'update', teacherId: teacher.teacherId })
            } else {
                // 添加新老师
                await teachersCollection.add({
                    data: {
                        ...teacher,
                        createTime: db.serverDate()
                    }
                })
                results.push({ action: 'add', teacherId: teacher.teacherId })
            }
        }

        return {
            success: true,
            message: '初始化/更新老师数据成功',
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
