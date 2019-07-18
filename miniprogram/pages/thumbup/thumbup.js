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
      { 'index': 0, 'text': '点赞我的' },
      { 'index': 1, 'text': '我的点赞' }
    ],

    userInfo: null,
    pageIndex: 1,
    pageSize: 5,
    pageCount: 0,
    total: 0,
    thumbupDocList: []
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
   * 退出当前页面
   */
  onUnload: function(){
    this.changeUnread();
  },

  /**
   * 顶部下拉刷新记录表
   */
  onPullDownRefresh: function(){
    //下拉刷新记录列表
    this.data.pageIndex = 1;
    if (this.data.currentIndexNav == 0) {
      this.fetchPraiseDocList("刷新中", true);
    } else {
      this.fetchPraiseDocList("刷新中", false);
    }
    //停止下拉刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 底部上拉刷新
   */
  onReachBottom: function(){
    if (this.data.pageIndex < this.data.pageCount) {
      //如果没到最后一页，页码加1，并加载新的一页记录列表数据
      this.data.pageIndex = this.data.pageIndex + 1;
      if (this.data.currentIndexNav == 0) {
        this.fetchPraiseDocList("刷新中", true);
      } else {
        this.fetchPraiseDocList("刷新中", false);
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
  setTotal: function() {
    let that = this;
    const db = wx.cloud.database();
    const myopenId = this.data.openId;
    if (that.data.currentIndexNav == 0) {
      db.collection("praiseDoc").where({ 'recordUserId': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.data.pageIndex = 1;
          that.fetchPraiseDocList("刷新中", true);
        }
      });
    } else {
      that.data.pageIndex = 1;
      db.collection("praiseDoc").where({ 'clickUserId': myopenId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          
          that.changeUnread();   //将未读信息转换为已读
          that.fetchPraiseDocList("刷新中", false);
        }
      });
    }
  },

  /*
   * 获取点赞列表
  */
  fetchPraiseDocList: function (title, sign) {
    let that = this;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    const db = wx.cloud.database();
    const myopenId = this.data.openId;
    if(sign){//获取点赞我的列表
      //先计算总数，才可以进行分页
      db.collection("praiseDoc").where({ "recordUserId": myopenId }).count({
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
          db.collection("praiseDoc").where({ "recordUserId": myopenId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('time', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //先获取原先的记录列表
              let tempList = that.data.thumbupDocList;
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
                thumbupDocList: tempList,
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
            },complete: function () {
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
    }else{//获取我的点赞列表
      //先计算总数，才可以进行分页
      db.collection("praiseDoc").where({ "clickUserId": myopenId }).count({
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
          db.collection("praiseDoc").where({ "clickUserId": myopenId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('time', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //先获取原先的记录列表
              let tempList = that.data.thumbupDocList;
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
                thumbupDocList: tempList,
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
            }, complete: function () {
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
   * 将点赞变为已读状态
   */
  changeUnread : function() {
    const db = wx.cloud.database();
    const thumbupDocList = this.data.thumbupDocList;
    const openId = this.data.openId;
    wx.cloud.callFunction({
      // 云函数名称
      name: 'updateOperate',
      // 传给云函数的参数
      data: {
        docList: thumbupDocList,
        doc: "praiseDoc"
      },
      success: function (res) {
        console.log("更改为已读成功");
        //从全局拿到最新的评论数和点赞数
        app.globalData.newThumbupCount = 0;
      },
      fail: function (res) {
        console.log("更改为已读失败");
      }
    });
  },
  gotoTopicDetials: function (event) {
    let _id = event.currentTarget.dataset.recordid;
    console.log(_id)
    wx.navigateTo({
      url: "../topicDetials/topicDetials?recordId=" + _id
    });
  },
  cancelPraise: function(e){
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定要取消点赞吗？',
      success: function (res) {
        if (res.confirm) {
          //确定
          wx.showLoading({
            title: '取消点赞中',
          });
          //删除后更新记录列表
          let list = that.data.thumbupDocList;
          let thumbupDocList = null;
          //去掉删除的
          for (let i = 0; i < list.length; i++) {
            if (list[i]._id == e.target.dataset.id) {
              list.splice(i, 1);
              thumbupDocList = list;
              break;
            }
          }
          let recordId = e.target.dataset.recordid;
          let clickUserId = e.target.dataset.clickuserid;
          let flag = 0;
          //调用点赞数的云函数
          wx.cloud.callFunction({
            // 云函数名称
            name: 'upLoadOperate',
            // 传给云函数的参数
            data: {
              _id: recordId,
              flag: flag,
            },
            success: function (res) {

              wx.cloud.callFunction({
                // 调用获取指定数据的云函数
                name: 'praiseOperate',
                // 传递给云函数的event参数
                data: {
                  recordId: recordId,
                  clickUserId: clickUserId,
                  operate: "remove"
                }
              }).then(res => {
                //获取一条新点赞记录
                that.updatePrasie(thumbupDocList);
              }).catch(err => {
              })
            },
            fail: console.error
          })
        }
      }
    });
  },
  updatePrasie: function (thumbupDocList) {
    let that = this;
    //加载一条新记录加入当前记录列表
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    let openId = that.data.openId;
    const db = wx.cloud.database();
    //更新总数，页数，还有记录列表
    db.collection("praiseDoc").where({ "clickUserId": openId }).count({
      success: function (res) {
        console.log("获取记录列表总数成功" + res.total);
        let pageCount = Math.ceil(res.total / pageSize);
        let total = res.total;
        if ((thumbupDocList.length + 1) <= res.total) {
          //如果还有未加载数据，则从数据库取一条数据补充当前页
          //分页获取记录列表内容，因为是当前页补充一条新数据，所以跳过pageIndex * pageSize - 1条
          db.collection("praiseDoc").where({ "clickUserId": openId }).skip(pageIndex * pageSize - 1).limit(1).orderBy('time', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //把获得的新数据加到尾部
              thumbupDocList = thumbupDocList.concat(res.data);
              //更新数据
              that.setData({
                pageCount: pageCount,
                total: total,
                thumbupDocList: thumbupDocList,
                canshow: true
              });
            },
            fail: function (res) {
              console.log("获取记录列表失败");
              that.setData({
                canshow: false
              })
            }
          });
        } else {
          //没有还未加载数据
          that.setData({
            pageCount: pageCount,
            total: total,
            thumbupDocList: thumbupDocList,
            canshow: true
          });
        }
      },
      fail: function (res) {
        console.log("获取记录列表总数失败");
        that.setData({
          canshow: false
        })
      }, complete: function () {
        wx.hideLoading();
      }
    });
  }
})