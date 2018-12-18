const RoboHash = require('./robohash')
const Koa = require('koa')
const Router = require('koa-router')
const error = require('koa-error')

const app = new Koa()
const router = new Router()

router.get('/ping', (ctx, next) => {
  ctx.body = 'pong'
})

router.get('/:email', async (ctx, next) => {
  ctx.set('Cache-Control', 'max-age=31536000')
  ctx.set('Content-Type', 'image/png')
  const robo = new RoboHash(ctx.params.email || 'default')
  ctx.body = await robo.assemble('set4')
})

app
  .use(error())
  .use(router.routes())
  .use(router.allowedMethods())


app.listen(3000)
