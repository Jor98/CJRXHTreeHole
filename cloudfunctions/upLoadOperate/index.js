// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'jorey-qzv8r'
})
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async(event, context) => {

  try {
    if (event.flag == 1) {
      return await db.collection('utteranceDoc').doc(event._id).update({
        data: {
          praiseNum: _.inc(1)
        }
      })
    } else {
      return await db.collection('utteranceDoc').doc(event._id).update({
        data: {
          praiseNum: _.inc(-1)
        }
      })
    }
  } catch (e) {
    console.error(e)
  }

}