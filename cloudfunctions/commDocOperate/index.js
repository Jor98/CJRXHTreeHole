// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async(event, context) => {
  switch (event.operate) {
    case 'removeRelative': //删除与一级评论相关的所有子回复
      try {
        return await db.collection('commentDoc').where(_.or([
          {
            _id: event.id
          },
          {
            recordId: event.id
          }
        ])).remove()
      } catch (e) {
        console.error(e)
      }
      break;
  }

}