const axios = require('axios')
const fs = require('fs')

// AppStore列表
const List = require('./list.json')
// 存储所有请求的容器
const reqList = []
var args = process.argv.splice(2);
if (args.length < 1) {
  console.log("参数传入不正确！");
  return;
}
const SCKEY = args.pop()
// 生成请求对象
for (item of List) {
  reqList.push(axios.get(`https://itunes.apple.com/lookup?id=${item.id}&country=${item.country}`))
}

async function getApp (list) {
  const data = await axios.all(list)
  // 对比容器
  let result = {}
  // 总价格
  let content = ''
  for (item of data) {
    const { trackName, trackId, price } = item.data.results[0]
    content += `- 【 ${trackName} 】 ==> ` + price + '\n'
    result[trackId] = price
  }
  fs.access('price.json', err => {
    if (err) {
      //  不存在price.json文件
      fs.writeFile('price.json', JSON.stringify(result), (err, data) => {
        console.log(err, data);
        console.log(result);
      })

    } else {
      fs.readFile('price.json', (err, data) => {
        if (err) {
          return
        } else {
          const newPrice = JSON.parse(data)
          for (key in result) {
            console.log(result[key], newPrice[key]);
            if (result[key] !== newPrice[key]) {
              // 价格发生了变化
              console.log("价格发生了变化");
              // Server酱提醒
              axios.request({
                url: `https://sctapi.ftqq.com/${SCKEY}.send`,
                method: 'post',
                data: `title=您监控的App价格发生了变化哦！&desp=${content}`
              }).then(result => {
                console.log(result.data);
              }).catch(err => {
                console.log("发送通知失败！", err);
              })
              fs.writeFile('price.json', JSON.stringify(result), (err) => {
              })
              return
            }
          }
          console.log('没有变化');
        }
      })
    }
  })
  // 总价格
  fs.writeFile('app.txt', content, () => {
    // console.log(content);
  })

}
getApp(reqList)
