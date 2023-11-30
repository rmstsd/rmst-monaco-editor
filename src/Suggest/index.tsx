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

const Suggest = () => {
  useEffect(() => {
    const editor = monaco.editor.create(document.querySelector('.container'), {
      value: pyCode,
      language: 'python',
      fontSize: 18,
      theme: '',
      glyphMargin: true
    })

    editor.addAction({
      id: 'format-py',
      label: '格式化',
      keybindings: [],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'format',
      contextMenuOrder: 1,

      run: () => {
        console.log(editor.getValue())

        axios.post('http://localhost:3655/format', { data: editor.getValue() }).then(res => {
          console.log(res.data)
          editor.setValue(res.data.result)
        })

        return null
      }
    })
  }, [])

  return <div className="container" style={{ width: 1000, height: 800 }}></div>
}

export default Suggest

const pyCode = `
import requests


def test():
    pass


test()
`
