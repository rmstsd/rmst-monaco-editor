import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { spawn } from 'cross-spawn'

const app = new Koa()
const router = new Router()

app.use(cors())

app.use(bodyParser())

router.post('/format', async ctx => {
  const pyCode = ctx.request.body.data

  const output = await executeCommandLine('black', ['--code', pyCode])
  // .then(output => {
  //   console.log('Command executed successfully. Output:', output)
  //   ctx.body = output
  // })
  // .catch(error => {
  //   console.error('Command execution failed:', error)
  // })

  console.log('Output', output)

  ctx.body = { result: output }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3655, () => {
  console.log('Server is running on port 3655')
})

function executeCommandLine(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args)

    let output = ''
    let errorOutput = ''

    process.stdout.on('data', data => {
      output += data.toString()
    })

    process.stderr.on('data', data => {
      errorOutput += data.toString()
    })

    process.on('close', code => {
      if (code === 0) {
        resolve(output)
      } else {
        reject(new Error(`Command execution failed with error code ${code}. Error output: ${errorOutput}`))
      }
    })
  })
}

// 使用示例
// executeCommandLine('echo', ['Hello', 'World'])
//   .then(output => {
//     console.log('Command executed successfully. Output:', output)
//   })
//   .catch(error => {
//     console.error('Command execution failed:', error)
//   })
