import { useEffect, useRef, useState } from 'react'

import * as monaco from 'monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.api'

import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import escapeStringRegexp from 'escape-string-regexp'
import axios from 'axios'

import { whenReady } from '@codingame/monaco-vscode-theme-defaults-default-extension'
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'
import { MonacoLanguageClient, initServices } from 'monaco-languageclient'
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc'

import getConfigurationServiceOverride, {
  updateUserConfiguration
} from '@codingame/monaco-vscode-configuration-service-override'

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'

import {
  BaseLanguageClient,
  MessageTransports,
  LanguageClientOptions
} from 'vscode-languageclient/lib/common/client.js'
import { LogLevel } from 'vscode'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

const list = ['qwer', 'vbnm', 'zxcg', 'uiop', 'test']

monaco.languages.registerCompletionItemProvider('python', {
  provideCompletionItems(model, position) {
    const { lineNumber, column } = position
    const textBeforePointer = model.getValueInRange({
      startLineNumber: lineNumber,
      startColumn: 0,
      endLineNumber: lineNumber,
      endColumn: column
    })

    const wordSeparatorsRegStringOr = monaco.editor.EditorOptions.wordSeparators.defaultValue
      .split('')
      .map(item => escapeStringRegexp(item))
      .join('|')
    const lastChars = textBeforePointer.split(new RegExp(wordSeparatorsRegStringOr)).at(-1)

    const tt = list.find(item => item.match(lastChars))
    if (!tt) {
      return null
    }

    return {
      suggestions: [
        {
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: tt,
          label: tt,
          detail: '',
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column,
            endLineNumber: position.lineNumber
          }
        }
      ]
    }
  }
})

let languageClient: MonacoLanguageClient
const languageId = 'python'

const createWebSocket = (url: string): WebSocket => {
  const webSocket = new WebSocket(url)
  webSocket.onopen = async () => {
    const socket = toSocket(webSocket)
    const reader = new WebSocketMessageReader(socket)
    const writer = new WebSocketMessageWriter(socket)
    languageClient = createLanguageClient({
      reader,
      writer
    })
    await languageClient.start()
    reader.onClose(() => languageClient.stop())
  }
  return webSocket
}

const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
  return new MonacoLanguageClient({
    name: 'Pyright Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: [languageId],
      // disable the default error handler

      // pyright requires a workspace folder to be present, otherwise it will not work
      workspaceFolder: {
        index: 0,
        name: 'workspace',
        uri: monaco.Uri.parse('/workspace')
      },
      synchronize: {
        // fileEvents: [vscode.workspace.createFileSystemWatcher('**')]
      }
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports)
      }
    }
  })
}

const Suggest = () => {
  async function init() {
    // init vscode-api
    // await initServices({
    //   userServices: {
    //     ...getThemeServiceOverride(),
    //     ...getTextmateServiceOverride(),
    //     ...getConfigurationServiceOverride(),
    //     ...getKeybindingsServiceOverride()
    //   },
    //   debugLogging: true,
    //   workspaceConfig: {
    //     workspaceProvider: {
    //       trusted: true,
    //       workspace: {
    //         workspaceUri: monaco.Uri.file('/workspace')
    //       },
    //       async open() {
    //         return false
    //       }
    //     },
    //     developmentOptions: {
    //       logLevel: LogLevel.Debug
    //     }
    //   }
    // })
    // const p = await whenReady()
    // console.log(p)

    const model = monaco.editor.createModel(pyCode, languageId, monaco.Uri.file('/workspace/hello.py'))

    const editor = monaco.editor.create(document.querySelector('.container'), {
      model,
      fontSize: 18,
      theme: '',
      glyphMargin: true
    })

    // extension configuration derived from:
    // https://github.com/microsoft/pyright/blob/main/packages/vscode-pyright/package.json
    // only a minimum is required to get pyright working
    const extension = {
      name: 'python-client',
      publisher: 'monaco-languageclient-project',
      version: '1.0.0',
      engines: {
        vscode: '^1.78.0'
      },
      contributes: {
        languages: [
          {
            id: languageId,
            aliases: ['Python'],
            extensions: ['.py', '.pyi']
          }
        ],
        commands: [
          {
            command: 'pyright.restartserver',
            title: 'Pyright: Restart Server',
            category: 'Pyright'
          },
          {
            command: 'pyright.organizeimports',
            title: 'Pyright: Organize Imports',
            category: 'Pyright'
          }
        ],
        keybindings: [
          {
            key: 'ctrl+k',
            command: 'pyright.restartserver',
            when: 'editorTextFocus'
          }
        ]
      }
    }
    // registerExtension(extension, ExtensionHostKind.LocalProcess)

    // const url = createUrl('localhost', 30020, '/pyright', { authorization: 'UserAuth' }, false)
    // console.log(url)
    // createWebSocket(url)

    editor.addAction({
      id: 'format-py',
      label: '格式化',
      keybindings: [],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'format',
      contextMenuOrder: 1,

      run: () => {
        axios.post('http://localhost:3655/format', { data: editor.getValue() }).then(res => {
          console.log(res.data)

          const nValue = res.data.result

          setEditorValue(nValue)

          // editor.setValue(res.data.result)
          // editor.getModel().setValue(res.data.result)
        })

        return null
      }
    })

    function setEditorValue(val) {
      editor.pushUndoStop()

      editor.executeEdits('from-format', [
        {
          range: editor.getModel().getFullModelRange(),
          text: val
        }
      ])

      editor.pushUndoStop()
    }
  }

  useEffect(() => {
    init()
  }, [])

  return <div className="container" style={{ width: 1000, height: 800, border: '1px solid #333' }}></div>
}

export default Suggest

export const createUrl = (
  hostname: string,
  port: number,
  path: string,
  searchParams: Record<string, any> = {},
  secure: boolean = location.protocol === 'https:'
): string => {
  const protocol = secure ? 'wss' : 'ws'
  const url = new URL(`${protocol}://${hostname}:${port}${path}`)

  for (let [key, value] of Object.entries(searchParams)) {
    if (value instanceof Array) {
      value = value.join(',')
    }
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

const pyCode = `
import random
import math

numbers=[random.randint(1,100) for _ in range(10)]
print("随机数列表:",numbers)

total  = sum(numbers)

average  = total/len(numbers)
print ("列表元素平均值:",average )

maximum=max(numbers)

sorted_numbers=sorted(numbers,reverse=True)
print ("排序后的列表:",sorted_numbers)

minimum=min(numbers)
print ("列表中的最小值:",minimum)

print ("列表元素总和:",total )
print ("列表中的最大值:",maximum )

def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(math.sqrt(num)) + 1):
        if num % i == 0:
            return False
    return True

prime_numbers = [num for num in numbers if is_prime(num)]
print("质数列表:", prime_numbers)

squared_numbers = [num ** 2 for num in numbers]
print("平方数列表:", squared_numbers)

random.shuffle(numbers)
print("乱序后的列表:", numbers)

for num in numbers:
    if num % 2 == 0:
        print(num, "是偶数")
    else:
        print(num, "是奇数")

print("程序结束")
`
