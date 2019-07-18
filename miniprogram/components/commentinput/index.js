// components/commentinput/index.js
var util = require('../../utils/util.js');
var th = require('../../utils/throttle/throttle.js');
var summary = require('../../utils/getSummary/getSummary.js');
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    informations: Object,
    replyComm: Object
  },

  /**
   * 组件的初始数据
   */
  data: {
    recordId: '',
    reviewerName: '',
    byReviewerId: '',
    byReviewerName: '',
    comments: '',
    firstImageUrl: '',
    summary: '',
    firstRead: true,
    upTime: '',
    reviewerIcon: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //点击发布出发时间，将评论内容上传到数据库
    publish: th.throttle(function(that,event) {
      //获取点击发布的时间
      var comment = event.detail.value.content;
      var time = new Date();
      time = util.formatTime(time, "Y-M-D h:m:s");

      if (that.data.replyComm == null) { //一级评论
        console.log('一级评论成功');
        event.detail = {
          jump: false,
          flag: 1
        };
        let myEventOption = {};
        that.triggerEvent('commentinput', event.detail, myEventOption);
        console.log(that.data.informations);
        let recid = that.data.informations.contentdetail._id; //记录id
        let revname = that.data.informations.userInfo.nickName; //评论者名字
        let revicon = that.data.informations.userInfo.avatarUrl; //评论者的头像
        let byrevid = that.data.informations.contentdetail._openid; //原帖者id
        let byrevname = that.data.informations.contentdetail.publisher; //原帖者名字
        let image = that.data.informations.contentdetail.imageUrls; //第一张图片地址
        let summ = that.data.informations.contentdetail.content; //摘要
        //判断是否有第一张图片
        if (image == null) {
          that.data.firstImageUrl = null
        } else {
          image = that.data.informations.contentdetail.imageUrls[0];
        }
        //摘要
        summ = summary.getSummary(summ);

        //上传到云数据库
        const db = wx.cloud.database();
        db.collection('commentDoc').add({
            data: {
              recordId: recid,
              reviewerName: revname,
              reviewerIcon: revicon,
              byReviewerId: byrevid,
              byReviewerName: byrevname,
              comments: comment,
              firstImageUrl: image,
              summary: summ,
              firstRead: true,
              upTime: time,
            }
          })
          .then(res => {
            //调用云函数进行修改评论的总数
            wx.cloud.callFunction({
              // 要调用的云函数名称
              name: 'utterDocOperate',
              // 传递给云函数的event参数
              data: {
                operate: 'sum',
                id: recid,
              }
            }).then(res => {
            }).catch(err => { 
            })
          })
          .catch(console.error);

      } else { //二级评论
        console.log('二级评论成功');
        let parentid = that.data.replyComm.parentId;
        let recid = that.data.replyComm.byreviewInfo._id;
        let revname = that.data.replyComm.userInfo.nickName; //评论者名字
        let revicon = that.data.replyComm.userInfo.avatarUrl; //评论者的头像
        let byrevid = that.data.replyComm.byreviewInfo._openid; //被评论者id
        let byrevname = that.data.replyComm.byreviewInfo.reviewerName; //被评论者名字
        let image = null; //第一张图片地址
        let summ = that.data.replyComm.byreviewInfo.comments; //摘要

        //摘要
        summ = summary.getSummary(summ);

        //上传到云数据库
        const db = wx.cloud.database();
        db.collection('commentDoc').add({
            data: {
              recordId: parentid,
              reviewerName: revname,
              reviewerIcon: revicon,
              byReviewerId: byrevid,
              byReviewerName: byrevname,
              comments: comment,
              firstImageUrl: image,
              summary: summ,
              firstRead: true,
              upTime: time,
            }
          })
          .then(res => {
            console.log(res)
          })
          .catch(console.error);
        event.detail = {
          jump: false,
          flag:2,
          _id:recid,
          parentid:parentid
        };
        let myEventOption = {};
        that.triggerEvent('commentinput', event.detail, myEventOption)
      }
    },1500)
  }
})