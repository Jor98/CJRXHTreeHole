var util = require('../../utils/util.js');
var th = require('../../utils/throttle/throttle.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    openId: null,
    canshow: false,
    currentIndexNav: 0,
    navList: [
      { 'index': 0, 'text': '评论我的' },
      { 'index': 1, 'text': '我的评论' }
    ],
    userInfo: null,
    pageIndex: 1,
    pageSize: 5,
    pageCount: 0,
    total: 0,
    commentDocList: [],
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
        });
      }
    }
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setTotal();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.changeUnread();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    //下拉刷新记录列表
    this.data.pageIndex = 1;
    if (this.data.currentIndexNav == 0) {
      this.fetchCommentDocList("刷新中", true);
    } else {
      this.fetchCommentDocList("刷新中", false);
    }
    //停止下拉刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.pageIndex < this.data.pageCount) {
      //如果没到最后一页，页码加1，并加载新的一页记录列表数据
      this.data.pageIndex = this.data.pageIndex + 1;
      if (this.data.currentIndexNav == 0) {
        this.fetchCommentDocList("刷新中", true);
      } else {
        this.fetchCommentDocList("刷新中", false);
      }
    } else {
      util.showTip('没有更多记录了');
    }
  },

  /**
   * 切换上方导航栏
   */
  activeNav: function (e) {
    this.setData({
      currentIndexNav: e.target.dataset.index,
      canshow: false
    });
    this.setTotal();
  },

  /**
   * 设置列表记录总数
   */
  setTotal: function () {
    let that = this;
    const db = wx.cloud.database();
    const myopenId = this.data.openId;
    if (that.data.currentIndexNav == 0) {
      db.collection("commentDoc").where({ 'byReviewerId': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.data.pageIndex = 1;
          that.fetchCommentDocList("刷新中", true);
        }
      });
    } else {
      that.data.pageIndex = 1;
      db.collection("commentDoc").where({ '_openid': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.changeUnread();   //将未读信息转换为已读
          that.fetchCommentDocList("刷新中", false);
        }
      });
    }
  },

  /**
   * 获取评论列表
   */
  fetchCommentDocList: function (title, sign) {
    let that = this;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    const db = wx.cloud.database();
    const myopenId = this.data.openId;
    if (sign) {//获取点赞我的列表
      //先计算总数，才可以进行分页
      db.collection("commentDoc").where({ 'byReviewerId': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          let pageCount = Math.ceil(res.total / pageSize);
          let total = res.total;
          //根据不同需求的抓取显示不同的进程提示
          wx.showLoading({
            title: title,
            mask: true
          });
          //分页获取记录列表内容
          db.collection("commentDoc").where({ "byReviewerId": myopenId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('upTime', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //先获取原先的记录列表
              let tempList = that.data.commentDocList;
              if (that.data.pageIndex == 1) {
                //如果要显示第一页，无需拼接记录列表数据
                tempList = res.data;
              } else {
                //否则，拼接新的记录列表数据
                tempList = tempList.concat(res.data);
              }
              //更新数据
              that.setData({
                pageCount: pageCount,
                total: total,
                commentDocList: tempList,
                canshow: true
              });
              //获取新纪录点赞状态
              //that.getOnLikePrivate(0, res.data.length, res.data);
            },
            fail: function (res) {
              console.log("获取记录列表失败");
              that.setData({
                canshow: false
              })
            },
            complete: function () {
              wx.hideLoading();
            }
          });
        },
        fail: function (res) {
          console.log("获取记录列表总数失败");
          that.setData({
            canshow: false
          })
        }
      });
    } else {//获取我的点赞列表
      //先计算总数，才可以进行分页
      db.collection("commentDoc").where({ '_openid': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          let pageCount = Math.ceil(res.total / pageSize);
          let total = res.total;
          //根据不同需求的抓取显示不同的进程提示
          wx.showLoading({
            title: title,
            mask: true
          });
          //分页获取记录列表内容
          db.collection("commentDoc").where({ '_openid': myopenId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('upTime', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //先获取原先的记录列表
              let tempList = that.data.commentDocList;
              if (that.data.pageIndex == 1) {
                //如果要显示第一页，无需拼接记录列表数据
                tempList = res.data;
              } else {
                //否则，拼接新的记录列表数据
                tempList = tempList.concat(res.data);
              }
              //更新数据
              that.setData({
                pageCount: pageCount,
                total: total,
                commentDocList: tempList,
                canshow: true
              });
              //获取新纪录点赞状态
              //that.getOnLikePrivate(0, res.data.length, res.data);
            },
            fail: function (res) {
              console.log("获取记录列表失败");
              that.setData({
                canshow: false
              })
            },
            complete:function(){
              wx.hideLoading();
            }
          });
        },
        fail: function (res) {
          console.log("获取记录列表总数失败");
          that.setData({
            canshow: false
          })
        }
      });
    }
  },

  /**
   * 将评论变为已读状态
   */
  changeUnread: function () {
    const db = wx.cloud.database();
    const commentDocList = this.data.commentDocList;
    const openId = this.data.openId;
    wx.cloud.callFunction({
      // 云函数名称
      name: 'updateOperate',
      // 传给云函数的参数
      data: {
        docList: commentDocList,
        doc: "commentDoc"
      },
      success: function (res) {
        console.log("更改为已读成功");
        //从全局拿到最新的评论数和点赞数
        app.globalData.newCommentsCount = 0;
      },
      fail: function (res) {
        console.log("更改为已读失败");
      }
    });
  },

  /**
   * 删除评论
   */
  deleteComment: function (event) {
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
      success: function (res) {
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
            wx.cloud.callFunction({
              // 要调用的云函数名称
              name: 'utterDocOperate',
              // 传递给云函数的event参数
              data: {
                operate: 'sub',
                id: recordId,
              }
            }).then(res => {console.log("评论数减1成功"); }).catch(err => { console.log("调用失败");})
            //然后触发事件到父组件进行渲染页面
            wx.hideLoading();
            that.fetchCommentDocList("刷新中", false);
          }).catch(err => {
            // handle error
          })
        }
      },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
  gotoTopicDetials: function (event) {
    let _id = event.currentTarget.dataset.recordid;
    console.log(_id)
    wx.navigateTo({
      url: "../topicDetials/topicDetials?recordId=" + _id
    });
  }

})