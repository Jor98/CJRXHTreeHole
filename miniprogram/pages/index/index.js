var util = require('../../utils/util.js');
var th = require('../../utils/throttle/throttle.js');

var avoidPreviewImageOnShow; //避免预览图片后，触发onShow函数

//index.js
const app = getApp()
Page({
  data: {
    openId: null,
    currentIndexNav: 0,
    canshow: false,
    navList: [
      {'index':0,'text':'树洞广场'},
      {'index':1,'text':'我的树洞'}
    ],

    userInfo: null,
    pageIndex: 1,
    pageSize: 5,
    pageCount: 0,
    total: 0,
    uploadDocList: [],
    isFirstIndex:true,

    date: null,
    text: null,
    onLikePublic: null,
    onLikePrivate: null

  },

  onLoad: function() {
    if (app.globalData.openId) {
      //开启未读消息自动刷新
      showMessage(app.globalData.openId);
      //全局应用已有openId
      this.setData({
        openId: app.globalData.openId
      });
    } else {
      // 由于 login云函数 是网络请求，可能会在 Page.onLoad 之后才返回 
      // 所以此处加入 callback 以防止这种情况 
      app.openIdReadyCallback = res => {
        //开启未读消息自动刷新
        showMessage(res.result.openid);
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
    if (avoidPreviewImageOnShow) {
      avoidPreviewImageOnShow = false;
      return;
    }
    let that = this;
    const db = wx.cloud.database();
    if (that.data.currentIndexNav == 0) {
      db.collection("utteranceDoc").where({ 'visibility': true }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.data.pageIndex = 1;
          that.fetchUtterancePublicDocList("刷新中", true);
        }
      });
    } else {
      that.data.pageIndex = 1;
      const openId = that.data.openId;
      db.collection("utteranceDoc").where({ '_openid': openId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.fetchUtterancePrivateDocList("刷新中", openId);
        }
      });
    }
  },
  
  onPullDownRefresh: function () {
    //下拉刷新记录列表
    this.data.pageIndex = 1;
    if(this.data.currentIndexNav == 0){
      this.fetchUtterancePublicDocList("刷新中",true);
    }else{
      const openId = this.data.openId;
      this.fetchUtterancePrivateDocList("刷新中", openId);
    }
    //停止下拉刷新
    wx.stopPullDownRefresh();
  },
  onReachBottom: function () {
    if (this.data.pageIndex < this.data.pageCount) {
      //如果没到最后一页，页码加1，并加载新的一页记录列表数据
      this.data.pageIndex = this.data.pageIndex + 1;
      if (this.data.currentIndexNav == 0){
        this.fetchUtterancePublicDocList("加载中", true);
      } else {
        const openId = this.data.openId;
        this.fetchUtterancePrivateDocList("刷新中", openId);
      }
    } else {
      util.showTip('没有更多记录了');
    }
  },
  
  fetchUtterancePublicDocList: function (title, visibility) {
    //获取树洞广场数据列表
    let that = this;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    const db = wx.cloud.database();
    //先计算总数，才可以进行分页
    db.collection("utteranceDoc").where({ 'visibility': visibility}).count({
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
        db.collection("utteranceDoc").where({ 'visibility': visibility }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('time', 'desc').get({
          success: function (res) {
            console.log("获取记录列表成功");
            //先获取原先的记录列表
            let tempList = that.data.uploadDocList;
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
              uploadDocList: tempList,
              canshow: true
            });
            if (that.data.total != 0) {
              //获取新纪录点赞状态
              that.getOnLikePublic(0, res.data.length, res.data);
            }
          },
          fail: function (res) {
            console.log("获取记录列表失败");
            that.setData({
              canshow: false
            })
          },complete: function(){
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
  },

  fetchUtterancePrivateDocList: function (title, openId) {
    //获取我的树洞列表
    let that = this;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    const db = wx.cloud.database();
    //先计算总数，才可以进行分页
    db.collection("utteranceDoc").where({ '_openid': openId}).count({
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
        db.collection("utteranceDoc").where({ '_openid': openId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('time', 'desc').get({
          success: function (res) {
            console.log("获取记录列表成功");
            //先获取原先的记录列表
            let tempList = that.data.uploadDocList;
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
              uploadDocList: tempList,
              canshow : true
            });
            if(that.data.total != 0){
              //获取新纪录点赞状态
              that.getOnLikePrivate(0, res.data.length, res.data);
            }
          },
          fail: function (res) {
            console.log("获取记录列表失败");
            that.setData({
              canshow:false
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
  },

  activeNav: function(e) {
    this.setData({
      currentIndexNav: e.target.dataset.index,
      canshow: false
    })
    let that = this;
    const db = wx.cloud.database();
    if (that.data.currentIndexNav == 0) {
      db.collection("utteranceDoc").where({ 'visibility': true }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.data.pageIndex = 1;
          that.fetchUtterancePublicDocList("刷新中", true);
        }
      });
    } else {
      that.data.pageIndex = 1;
      const openId = that.data.openId;
      db.collection("utteranceDoc").where({ '_openid': openId }).count({
        success: function (res) {
          console.log("获取记录列表总数成功" + res.total);
          that.fetchUtterancePrivateDocList("刷新中", openId);
        }
      });
    }
  },

  deleteUtteranceDoc: function (event) {
    let that = this;
    //询问用户是否删除
    wx.showModal({
      title: '提示',
      content: '确定要删除记录吗？',
      success: function (res) {
        if (res.confirm) {
          //确定删除
          wx.showLoading({
            title: '删除中',
          });
          //获得记录在数据库的id
          let id = event.target.dataset.id;
          const db = wx.cloud.database();
          //从数据库删除该记录
          db.collection('utteranceDoc').doc(id).remove({
            success: function (res) {
              console.log("删除记录成功");
              //删除praiseDoc表中的关于这条的所有点赞的用户
              that.deletePraiseDoc(id);
              //获得图片数组在存储的fileId，先获取imageurl
              let imageUrls = event.target.dataset.imageurls;
              if (imageUrls){
                for (let i = 0; i < imageUrls.length; i++) {
                  let fileId = util.getFileId(imageUrls[i]);
                  //从存储真正删除该图片
                  wx.cloud.deleteFile({
                    fileList: [fileId],
                    success: function (res) {
                      console.log("删除照片成功");
                    },
                    fail: function (res) {
                      console.log("删除照片失败");
                    }
                  });
                }
              }
              //在刷新数据前将列表隐藏
              that.setData({
                canshow:false
              })
              //根据id更新图片列表
              that.updateImages(id);
            },
            fail: function (res) {
              console.log("删除照片记录失败");
            },
            complete: function (res) {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },

  updateImages: function (id) {
    let that = this;
    //删除后更新记录列表
    let list = that.data.uploadDocList;
    let uploadDocList = null;
    //去掉删除的
    for (let i = 0; i < list.length; i++) {
      if (list[i]._id == id) {
        list.splice(i, 1);
        uploadDocList = list;
        break;
      }
    }
    //加载一条新记录加入当前记录列表
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;
    const openId = that.data.openId;
    const db = wx.cloud.database();
    //更新总数，页数，还有记录列表
    db.collection("utteranceDoc").where({ '_openid': openId }).count({
      success: function (res) {
        console.log("获取记录列表总数成功" + res.total);
        let pageCount = Math.ceil(res.total / pageSize);
        let total = res.total;
        if ((uploadDocList.length + 1) <= res.total) {
          //如果还有未加载数据，则从数据库取一条数据补充当前页
          //根据不同需求的抓取显示不同的进程提示
          wx.showLoading({
            title: '刷新中',
          });
          //分页获取记录列表内容，因为是当前页补充一条新数据，所以跳过pageIndex * pageSize - 1条
          db.collection("utteranceDoc").where({ '_openid': openId }).skip(pageIndex * pageSize - 1).limit(1).orderBy('time', 'desc').get({
            success: function (res) {
              console.log("获取记录列表成功");
              //把获得的新数据加到尾部
              uploadDocList = uploadDocList.concat(res.data);
              //更新数据
              that.setData({
                pageCount: pageCount,
                total: total,
                uploadDocList: uploadDocList,
                canshow:true
              });
            },
            fail: function (res) {
              console.log("获取记录列表失败");
              that.setData({
                canshow:false
              })
            },
            complete: function (res) {
              wx.hideLoading();
            }
          });
        } else {
          //没有还未加载数据
          that.setData({
            pageCount: pageCount,
            total: total,
            uploadDocList: uploadDocList,
            canshow:true
          });
        }
      },
      fail: function (res) {
        console.log("获取记录列表总数失败");
        that.setData({
          canshow:false
        })
      }
    });
  },
  deletePraiseDoc: function (recordId) {
    wx.cloud.callFunction({
      // 要调用的云函数名称
      name: 'praiseOperate',
      // 传递给云函数的event参数

      data: {
        recordId: recordId,
        operate: 'removeall'
      }
    }).then(res => {
      // output: res.result === 3
    }).catch(err => {
      // handle error
    })
  },
  gotoTopicDetials: function (event) {
  let _id = event.currentTarget.dataset.recordid
    wx.navigateTo({
      url: "../topicDetials/topicDetials?recordId="+_id
    });
  },

  getOnLikePublic: function (index, length, newDoc) {
    let that = this;
    let openId = this.data.openId;
    let id = newDoc[index]._id;
    const db = wx.cloud.database();
    db.collection("praiseDoc").where({
      clickUserId: openId,
      recordId: id
    }).count({
      success: function (res) {
        if (res.total != 0) {
          //添加喜欢键值对id:true
          let state = "onLikePublic." + id;
          that.setData({
            [state]: true
          });
        } else {
          console.log("用户不喜欢");
          //添加不喜欢键值对id:false
          let state = "onLikePublic." + id;
          that.setData({
            [state]: false
          });
        }
      },
      fail: function (res) {
        //获取失败,默认是不喜欢
        console.log("默认用户不喜欢");
        //添加不喜欢键值对id:true
        let state = "onLikePublic." + id;
        that.setData({
          [state]: false
        });
      },
      complete: function (res) {
        if ((index + 1) == length) {
          //最后一个记录判断当前用户是否喜欢完成
          wx.hideLoading();
        } else {
          //否则，判断下一个记录
          index = index + 1;
          that.getOnLikePublic(index, length, newDoc);
        }
      }
    });
  },
  getOnLikePrivate: function (index, length, newDoc) {
    let that = this;
    let openId = this.data.openId;
    let id = newDoc[index]._id;
    const db = wx.cloud.database();
    db.collection("praiseDoc").where({
      clickUserId: openId,
      recordId: id
    }).count({
      success: function (res) {
        if (res.total != 0) {
          //添加喜欢键值对id:true
          let state = "onLikePrivate." + id;
          that.setData({
            [state]: true
          });
        } else {
          console.log("用户不喜欢");
          //添加不喜欢键值对id:false
          let state = "onLikePrivate." + id;
          that.setData({
            [state]: false
          });
        }
      },
      fail: function (res) {
        //获取失败,默认是不喜欢
        console.log("默认用户不喜欢");
        //添加不喜欢键值对id:true
        let state = "onLikePrivate." + id;
        that.setData({
          [state]: false
        });
      },
      complete: function (res) {
        if ((index + 1) == length) {
          //最后一个记录判断当前用户是否喜欢完成
          wx.hideLoading();
        } else {
          //否则，判断下一个记录
          index = index + 1;
          that.getOnLikePrivate(index, length, newDoc);
        }
      }
    });
  },
  /**
   * 点赞响应事件(已添加节流函数，防止恶意点击)
   */
  onLikePublic: th.throttle(function (that, event) {
    //点赞获取点赞者的openid和记录的id和点赞数
    let localopenid = app.globalData.openId;
    let _id = event.currentTarget.dataset.id;
    let tempList = that.data.uploadDocList;
    let state = "onLikePublic." + _id;
    let recordUserOpenId;
    let recordUserName;
    let firstImage;
    let summary;
    let i;
    let flag;
    for (i = 0; i < tempList.length; i++) {
      if (_id == tempList[i]._id) {
        recordUserOpenId = tempList[i]._openid;
        recordUserName = tempList[i].publisher;
        if (tempList[i].imageUrls != null) {
          firstImage = tempList[i].imageUrls[0];
        }else{
          firstImage = null;
        }
        summary = that.getSummary(tempList[i].content);
        break;
      }
    }
    if (!that.data.onLikePublic[_id]) { //点赞
      console.log(tempList[i].praiseNum);
      tempList[i].praiseNum = tempList[i].praiseNum + 1;
      flag = 1;
      wx.showToast({
        title: '点赞成功',
      });
    } else { //取消点赞
      tempList[i].praiseNum = tempList[i].praiseNum == 0 ? 0 : tempList[i].praiseNum - 1;
      flag = 0;
      wx.showToast({
        title: '已取消点赞',
      });
    }
    that.setData({
      [state]: !that.data.onLikePublic[_id],
      uploadDocList: tempList
    });

    //修改云端数据
    that.upLoadLikeNumber(flag, _id, localopenid, recordUserOpenId, recordUserName, firstImage, summary);
  }, 2000),
  onLikePrivate: th.throttle(function (that, event) {
    //点赞获取点赞者的openid和记录的id和点赞数
    let localopenid = app.globalData.openId;
    let _id = event.currentTarget.dataset.id;
    let tempList = that.data.uploadDocList;
    let state = "onLikePrivate." + _id;
    let recordUserOpenId;
    let recordUserName;
    let firstImage;
    let summary;
    let i;
    let flag;
    for (i = 0; i < tempList.length; i++) {
      if (_id == tempList[i]._id) {
        recordUserOpenId = tempList[i]._openid;
        recordUserName = tempList[i].publisher;
        if (tempList[i].imageUrls != null) {
          firstImage = tempList[i].imageUrls[0];
        } else {
          firstImage = null;
        }
        summary = that.getSummary(tempList[i].content);
        break;
      }
    }
    if (!that.data.onLikePrivate[_id]) { //点赞
      tempList[i].praiseNum = tempList[i].praiseNum + 1;
      flag = 1;
      wx.showToast({
        title: '点赞成功',
      });
    } else { //取消点赞
      tempList[i].praiseNum = tempList[i].praiseNum == 0 ? 0 : tempList[i].praiseNum - 1;
      flag = 0;
      wx.showToast({
        title: '已取消点赞',
      });
    }
    that.setData({
      [state]: !that.data.onLikePrivate[_id],
      uploadDocList: tempList
    });

    //修改云端数据
    that.upLoadLikeNumber(flag, _id, localopenid, recordUserOpenId, recordUserName, firstImage, summary);
  }, 2000),

  getSummary: function(content){
    if(content.length <= 50){
      content = content;
    }else{
      content = content.slice(0, 50) + '...';
    }  
    return content;
  },

  //上传点赞数据
  upLoadLikeNumber: function (flag, id, opendId, recordUserOpenId, recordUserName, firstImage, summary) {
    let operate = null;
    operate = flag == 1 ? 'add' : 'remove';
    //事后上传数据
    //生成大致点赞时间
    let time = util.formatTime(new Date(), "Y-M-D h:m:s");
    let clickUserName = app.globalData.userInfo.nickName;
    console.log(recordUserOpenId)
    //调用点赞数的云函数
    wx.cloud.callFunction({
      // 云函数名称
      name: 'upLoadOperate',
      // 传给云函数的参数
      data: {
        _id: id,
        flag: flag,
      },
      success: function (res) {
        wx.cloud.callFunction({
          // 调用获取指定数据的云函数
          name: 'praiseOperate',
          // 传递给云函数的event参数
          data: {
            recordId: id,
            clickUserId: opendId,
            recordUserId: recordUserOpenId,
            time: time,
            clickUserName: clickUserName,
            recordUserName: recordUserName,
            firstImage: firstImage,
            summary: summary,
            first: true,
            operate: operate
          }
        }).then(res => {

        }).catch(err => {
        })
      },
      fail: console.error
    })
  },

  changeVisibility:function(event){
    const that = this;
    const openId = this.data.openId;
    const db = wx.cloud.database();
    const id = event.target.dataset.id;
    const visibility = event.target.dataset.visibility;
    let uploadDocList = this.data.uploadDocList;

    for(let i = 0; i < uploadDocList.length; i++){
      if (uploadDocList[i]._id == id){
        uploadDocList[i].visibility = !visibility;
      }
    }

    wx.showModal({
      title: '提示',
      content: '确定要转变吗？',
      success: function (res) {
        if (res.confirm) {
          //确定
          wx.showLoading({
            title: '操作进行中',
          });
          if (visibility) {    //公开转私有
            db.collection('utteranceDoc').doc(id).update({
              data: {
                visibility: false
              },
              success: result => {
                that.setData({
                  uploadDocList: uploadDocList
                })
                console.log("转换成功");
              },
              fail: result => {
                console.log("转换失败");
              },
              complete : res => {
                wx.hideLoading();
              }
            })
          } else {      //私有转公开
            db.collection('utteranceDoc').doc(id).update({
              data: {
                visibility: true
              },
              success: result => {
                that.setData({
                  uploadDocList: uploadDocList
                })
                console.log("转换成功");
              },
              fail: result => {
                console.log("转换失败");
              },
              complete: result =>{
                wx.hideLoading();
              }
            })
          }

        }
      }
    });
  },
  //图片预览
  previewimg: function(event){
    avoidPreviewImageOnShow = true;
    const current = event.target.dataset.current;
    const urls = event.target.dataset.urls;
    wx.previewImage({
      current: current, 
      urls: urls 
    })
  }
})

//获取未读消息，隔3秒刷新一次
function showMessage(openId) {
  const db = wx.cloud.database();
  //获得评论promise对象
  let p1 = db.collection('commentDoc').where({
    byReviewerId: openId, firstRead: true
  }).count();
  //获得点赞promise对象
  let p2 = db.collection('praiseDoc').where({
    recordUserId: openId, first: true
  }).count();
  //等待获取评论数点赞数
  Promise.all([p1, p2])
  .then((res) => {
    //赋予全局，以便message页面获取
    app.globalData.newCommentsCount = res[0].total;
    app.globalData.newThumbupCount = res[1].total;
    //更新消息tabBar
    let sum = res[0].total + res[1].total;
    if (sum == 0) {
      wx.removeTabBarBadge({
        index: 2
      });
    } else {
      wx.setTabBarBadge({
        index: 2,
        text: String(sum)
      });
    }
  }).catch((error) => {
    console.log(error)
  });
  setTimeout(function () {
    showMessage(openId);
  }, 1000);
}