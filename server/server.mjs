import { resolve } from 'path'
import { WebSocketServer } from 'ws'
import { URL } from 'url'
// import { IncomingMessage, Server } from 'http'
import express from 'express'

// import { Socket } from 'net'
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server'
import { Message, InitializeRequest } from 'vscode-languageserver'
import { getLocalDirectory } from './fs-utils.mjs'

const baseDir = resolve(getLocalDirectory(import.meta.url))
const relativeDir = '../node_modules/pyright/dist/pyright-langserver.js'
runPythonServer(baseDir, relativeDir)

function runPythonServer(baseDir, relativeDir) {
  process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception: ', err.toString())
    if (err.stack) {
      console.error(err.stack)
    }
  })

  // create the express application
  const app = express()
  // server the static content, i.e. index.html
  const dir = getLocalDirectory(import.meta.url)
  app.use(express.static(dir))
  // start the server
  const server = app.listen(30020)
  // create the web socket
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    clientTracking: true,
    verifyClient: (
      clientInfo,
      // {  origin: string secure: booleanreq: IncomingMessage}
      callback
    ) => {
      const parsedURL = new URL(`${clientInfo.origin}${clientInfo.req?.url ?? ''}`)
      const authToken = parsedURL.searchParams.get('authorization')
      if (authToken === 'UserAuth') {
        // eslint-disable-next-line n/no-callback-literal
        callback(true)
      } else {
        // eslint-disable-next-line n/no-callback-literal
        callback(false)
      }
    }
  })
  upgradeWsServer({
    serverName: 'PYRIGHT',
    pathName: '/pyright',
    server,
    wss,
    baseDir,
    relativeDir
  })
}

/**
 * start the language server inside the current process
 */
function launchLanguageServer(serverName, socket, baseDir, relativeDir) {
  // start the language server as an external process
  const ls = resolve(baseDir, relativeDir)

  const reader = new WebSocketMessageReader(socket)
  const writer = new WebSocketMessageWriter(socket)
  const socketConnection = createConnection(reader, writer, () => socket.dispose())
  console.log('ls', ls)
  const serverConnection = createServerProcess(serverName, 'node', [ls, '--stdio'])
  if (serverConnection) {
    forward(socketConnection, serverConnection, message => {
      if (Message.isRequest(message)) {
        console.log(`${serverName} Server received:`)
        console.log(message)
        if (message.method === InitializeRequest.type.method) {
          const initializeParams = message.params
          initializeParams.processId = process.pid
        }
      }
      if (Message.isResponse(message)) {
        // ws 给浏览器发消息
        console.log(`${serverName} Server sent:`)
        console.log(message)
      }
      return message
    })
  }
}

function upgradeWsServer(config) {
  config.server.on('upgrade', (request, socket, head) => {
    const baseURL = `http://${request.headers.host}/`
    const pathName = request.url ? new URL(request.url, baseURL).pathname : undefined

    if (pathName === config.pathName) {
      config.wss.handleUpgrade(request, socket, head, webSocket => {
        const socket = {
          send: content =>
            webSocket.send(content, error => {
              if (error) {
                throw error
              }
            }),
          onMessage: cb =>
            webSocket.on('message', data => {
              console.log(data.toString())
              cb(data)
            }),
          onError: cb => webSocket.on('error', cb),
          onClose: cb => webSocket.on('close', cb),
          dispose: () => webSocket.close()
        }
        // launch the server when the web socket is opened
        if (webSocket.readyState === webSocket.OPEN) {
          launchLanguageServer(config.serverName, socket, config.baseDir, config.relativeDir)
        } else {
          webSocket.on('open', () => {
            launchLanguageServer(config.serverName, socket, config.baseDir, config.relativeDir)
          })
        }
      })
    }
  })
}
