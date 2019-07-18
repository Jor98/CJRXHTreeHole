// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  switch (event.operate) {
    case 'remove':
      try {
        return await db.collection('praiseDoc').where({
          recordId: event.recordId,
          clickUserId: event.clickUserId
        }).remove()
      } catch (e) {
        console.error(e)
      }
      break;
    //删除一条记录的所有点赞用户
    case 'removeall':
      try {
        return await db.collection('praiseDoc').where({
          recordId: event.recordId,
        }).remove()
      } catch (e) {
        console.error(e)
      }
      break;
    case 'add':
      try {
        return await db.collection('praiseDoc').add({
          // data 字段表示需新增的 JSON 数据
          data: {
            recordId: event.recordId,
            clickUserId: event.clickUserId,
            recordUserId: event.recordUserId,
            time: event.time,
            clickUserName: event.clickUserName,
            recordUserName: event.recordUserName,
            firstImage: event.firstImage,
            first: event.first,
            summary: event.summary
          }
        })
      } catch (e) {
        console.error(e)
      }
      break;

    case 'get':
      try {
        return await db.collection('praiseDoc').where({
          // data 字段表示需新增的 JSON 数据
          data: {
            recordId: event.recordId,
            clickUserId: event.clickUserId
          }
        }).get()
      } catch (e) {
        console.error(e)
      }
      break;
    default:
      break;
  }
}