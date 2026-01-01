// app.js
const cloudConfig = require('./config/cloud.js')
const db = require('./utils/db.js')

App({
  globalData: {
    userInfo: null,
    currentUser: null,  // { id, name, role }
    isLoggedIn: false,
    cloudReady: false  // 云开发是否就绪
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      const envConfig = cloudConfig.envId ? { env: cloudConfig.envId } : {}

      wx.cloud.init({
        ...envConfig,
        traceUser: true,
      })

      console.log('云开发初始化成功', cloudConfig.envId ? `环境: ${cloudConfig.envId}` : '使用默认环境')
      this.globalData.cloudReady = true

      // 初始化老师数据
      this.initCloudData()
    }

    // 检查本地登录状态
    const currentUser = wx.getStorageSync('currentUser')
    if (currentUser) {
      this.globalData.currentUser = currentUser
      this.globalData.isLoggedIn = true
    }
  },

  // 初始化云端数据
  async initCloudData() {
    try {
      const result = await db.initTeachers()
      console.log('云端数据初始化结果:', result)
    } catch (err) {
      console.error('初始化云端数据失败:', err)
    }
  },

  // 设置当前用户
  setCurrentUser(user) {
    this.globalData.currentUser = user;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('currentUser', user);
  },

  // 退出登录
  logout() {
    this.globalData.currentUser = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('currentUser');
  }
});
