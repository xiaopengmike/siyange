const app = getApp();

Component({
    data: {
        selected: 0,
        color: "#999999",
        selectedColor: "#4A90D9",
        list: [] // 动态列表
    },

    attached() {
        this.initByRole();
    },

    methods: {
        // 根据角色初始化列表
        initByRole() {
            const user = wx.getStorageSync('currentUser') || (app && app.globalData.currentUser);
            const role = user ? user.role : 'teacher'; // 默认老师

            let list = [];
            if (role === 'student') {
                // 学生角色：2个菜单
                list = [
                    {
                        pagePath: "/pages/schedule/schedule",
                        text: "学生的课表",
                        icon: "📅"
                    },
                    {
                        pagePath: "/pages/profile/profile",
                        text: "我的",
                        icon: "👤"
                    }
                ];
            } else {
                // 老师/校长角色：3个菜单
                list = [
                    {
                        pagePath: "/pages/schedule/schedule",
                        text: "老师的课表",
                        icon: "📅"
                    },
                    {
                        pagePath: "/pages/students/students",
                        text: "我的学生",
                        icon: "👫"
                    },
                    {
                        pagePath: "/pages/profile/profile",
                        text: "我的",
                        icon: "👤"
                    }
                ];
            }

            this.setData({ list });
        },

        switchTab(e) {
            const data = e.currentTarget.dataset
            const url = data.path
            wx.switchTab({ url })
            // 注意：选中态的维护通常在各页面的 onShow 中通过 getTabBar() 完成
        }
    }
})
