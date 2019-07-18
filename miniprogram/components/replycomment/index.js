// components/replycomment/index.js
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
    delete: '删除评论',
    point: '/images/point.png',
    group: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    deleteComment: function(event) {
      let that = this;
      //获取该条记录的_id
      var _id = event.target.dataset.id;
      var recordid = event.target.dataset.recordid;
      //调用小程序端API进行删除数据
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
            //通过id删除指定的二级评论
            const db = wx.cloud.database();
            db.collection('commentDoc').doc(_id).remove()
              .then(res => {
                wx.hideLoading();
              })
              .catch(console.error)
            that.triggerEvent('myDelComment', { _id: _id,
            recordId:recordid }, {});
          }
        }
      })
    }
  }
})