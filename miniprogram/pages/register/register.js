// pages/register/register.js
const db = require('../../utils/db.js')
const app = getApp()

Page({
  data: {
    step: 1,
    role: '',
    name: '',
    phone: '',
    password: '',
    submitting: false,
    canRegister: false,
    hasExternalRole: false // 是否由外部带入角色
  },

  onLoad(options) {
    if (options.role) {
      this.setData({
        role: options.role,
        step: 2,
        hasExternalRole: true
      });
    }
  },

  selectRole(e) {
    const { role } = e.currentTarget.dataset
    this.setData({
      role,
      step: 2
    })
  },

  goToStep1() {
    if (this.data.hasExternalRole) {
      wx.navigateBack();
    } else {
      this.setData({
        step: 1,
        role: ''
      })
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value }, this.validate)
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value }, this.validate)
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value }, this.validate)
  },

  validate() {
    const { name, phone, password } = this.data
    const canRegister = name.length >= 2 && phone.length === 11 && password.length >= 6
    this.setData({ canRegister })
  },

  async handleRegister() {
    const { role, name, phone, password } = this.data

    if (!this.data.canRegister) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '注册中...' })

    try {
      const userData = {
        name,
        phone,
        password,
        role
      }

      // 校长和老师都存储在老师集合中

      const result = await db.registerUser(role, userData)

      if (result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.error || '注册失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('注册异常:', err)
      wx.showToast({
        title: '注册服务异常',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
      wx.hideLoading()
    }
  },

  goToLogin() {
    wx.navigateBack()
  }
})