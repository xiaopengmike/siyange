// 云函数入口文件 - 初始化老师数据
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 默认老师数据
const DEFAULT_TEACHERS = [
    { teacherId: 'teacher_001', name: 'Judy老师', color: '#4A90D9' },
    { teacherId: 'teacher_002', name: '某英语老师', color: '#66BB6A' },
    { teacherId: 'teacher_003', name: '王老师', color: '#FF7043' },
    { teacherId: 'teacher_004', name: '李老师', color: '#AB47BC' }
]

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    try {
        const teachersCollection = db.collection('teachers')

        // 检查是否已有数据
        const { total } = await teachersCollection.count()

        if (total === 0) {
            // 批量添加老师
            const results = []
            for (const teacher of DEFAULT_TEACHERS) {
                const result = await teachersCollection.add({
                    data: {
                        ...teacher,
                        createTime: db.serverDate()
                    }
                })
                results.push(result)
            }

            return {
                success: true,
                message: '初始化老师数据成功',
                count: results.length,
                openid: wxContext.OPENID
            }
        } else {
            return {
                success: true,
                message: '老师数据已存在，无需初始化',
                count: total,
                openid: wxContext.OPENID
            }
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
