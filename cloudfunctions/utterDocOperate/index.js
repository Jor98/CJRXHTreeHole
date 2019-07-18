// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async(event, context) => {

  switch (event.operate) {
    case 'sum': //评论数加1
      console.log('增加评论数');
      console.log(event.id);
      console.log(event.operate);
      await db.collection('utteranceDoc').doc(event.id).update({
          // data 传入需要局部更新的数据
          data: {
            commentNum: _.inc(1)
          }
        })
        .then(console.log)
        .catch(console.error)
      break;
    case 'sub': //评论数减1
      console.log('减去评论数');
      console.log(event.id);
      console.log(event.operate);
      await db.collection('utteranceDoc').doc(event.id).update({
        
          // data 传入需要局部更新的数据
          data: {
            commentNum: _.inc(-1)
          }
        })
        .then(console.log)
        .catch(console.error)
      break;
  }

}