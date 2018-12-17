const RoboHash = require('./robohash')

const robo = new RoboHash('csvwolf@qq.com')

const runner = async () => {
  await robo.assemble()
}

(async () => {
  await runner()
})()
