// components/comment/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comment: Object,
    localOpenId: String
  },

  /**
   * 组件的初始数据
   */
  data: {
    deleteString: '删除评论',

  },

  /**
   * 组件的方法列表
   */
  methods: {
    deleteComment: function(event) {
      var _id = event.target.dataset.id;
      var recordId = event.target.dataset.recordid;
      var that = this;
      wx.showModal({
        title: '删除',
        content: '是否删除评论',
        showCancel: true,
        cancelText: '取消',
        cancelColor: '#3B49E0',
        confirmText: '确定',
        confirmColor: '#576B95',
        success: function(res) {
          if (res.confirm) {
            wx.showLoading({
              title: '删除中',
              mask: true,
            })
            //调用云函数进行删除根据指定的_id和recordId进行删除对应数据库的内容
            wx.cloud.callFunction({
              // 要调用的云函数名称
              name: 'commDocOperate',
              // 传递给云函数的event参数
              data: {
                id: _id,
                operate: 'removeRelative'
              }
            }).then(res => {
              //然后触发事件到父组件进行渲染页面
              that.triggerEvent('myDelComment', {_id:_id}, {});
              wx.hideLoading();

              wx.cloud.callFunction({
                // 要调用的云函数名称
                name: 'utterDocOperate',
                // 传递给云函数的event参数
                data: {
                  operate: 'sub',
                  id: recordId,
                }
              }).then(res => {}).catch(err => {})
            }).catch(err => {
              // handle error
            })
          }
        },
        fail: function(res) {},
        complete: function(res) {},
      })


    }
  }

})