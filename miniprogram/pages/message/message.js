// miniprogram/pages/message/message.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    openId: null,
    newCommentsCount: 0,
    newThumbupCount: 0
  },

  goComments: function(){
    wx.navigateTo({
      url:'../comments/comments'
    })
  },

  goThumbup: function(){
    wx.navigateTo({
      url: '../thumbup/thumbup',
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (app.globalData.openId) {
      //全局应用已有openId
      this.setData({
        openId: app.globalData.openId
      });
    } else {
      // 由于 login云函数 是网络请求，可能会在 Page.onLoad 之后才返回 
      // 所以此处加入 callback 以防止这种情况 
      app.openIdReadyCallback = res => {
        this.setData({
          openId: res.result.openid
        })
      }
    }
  },
  onShow: function () {
    //获取全局消息
    getMessage(this);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})

//获取未读消息，隔0.1秒刷新一次
function getMessage(that) {
  //从全局拿到最新的评论数和点赞数
  that.setData({
    newCommentsCount: app.globalData.newCommentsCount,
    newThumbupCount: app.globalData.newThumbupCount
  });
  setTimeout(function () {
    getMessage(that);
  }, 1000);
}