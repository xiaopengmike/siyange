// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { role, account, password } = event
    const wxContext = cloud.getWXContext()

    try {
        let collectionName = ''
        if (role === 'teacher' || role === 'principal') {
            collectionName = 'teachers'
        } else if (role === 'student') {
            collectionName = 'students'
        } else {
            return { success: false, error: '无效的角色' }
        }

        const collection = db.collection(collectionName)

        // 查询用户
        const { data } = await collection.where({
            phone: account
        }).get()

        if (!data || data.length === 0) {
            return { success: false, error: '账号不存在' }
        }

        const user = data[0]

        // 校验密码
        if (user.password !== password) {
            return { success: false, error: '密码错误' }
        }

        // 权限校验
        if (role === 'principal') {
            if (!user.roles || !user.roles.includes('principal')) {
                return { success: false, error: '无权以此身份登录' }
            }
        }

        // 登录成功，移除敏感信息后返回
        delete user.password

        // 如果是老师/校长登录，确保返回 teacher 对象结构一致性
        if (role === 'teacher' || role === 'principal') {
            return { success: true, teacher: user }
        } else {
            return { success: true, student: user }
        }

    } catch (err) {
        console.error('登录失败', err)
        return { success: false, error: '登录服务异常' }
    }
}
