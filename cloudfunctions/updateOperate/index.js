// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'jorey-qzv8r'
})

const db = cloud.database();
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const docList = event.docList;
    const doc = event.doc;
    // for (let i = 0; i < thumbupDocList.length; i++) {
    //   if (thumbupDocList[i].first) {
    //     await db.collection('praiseDoc').doc(thumbupDocList[i]._id).update({
    //       data: {
    //         first: false
    //       }
    //     })
    //     console.log();
    //   }
    // }
    if (doc == "praiseDoc"){
      await db.collection(doc).where({
        _id: _.in(docList.map(function(v,i){return v._id})) 
      }).update({
        data: {
          first: false
        }
      })
    } else if (doc == "commentDoc"){
      await db.collection(doc).where({
        _id: _.in(docList.map(function (v, i) { return v._id }))
      }).update({
        data: {
          firstRead: false
        }
      })
    }
  } catch (e) {
    console.error(e)
  }

}