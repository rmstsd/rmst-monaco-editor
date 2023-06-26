import { useEffect, useRef, useState } from 'react'

import * as monaco from 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { jsCode } from './code'
import classNames from 'classnames'

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

const Normal_Class = 'break-dot'
const Active_Class = 'break-dot-active'
const Whole_Line_Class = 'whole-line'

function App() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  editorRef.current = editor

  const getAllBreakDots = () => {
    const model = editorRef.current.getModel()
    const des = model.getAllDecorations()

    const breakDots = des.filter(item => item.options.glyphMarginClassName?.includes(Normal_Class))

    return breakDots
  }

  useEffect(() => {
    console.log('MouseTargetType', monaco.editor.MouseTargetType)

    const editor = monaco.editor.create(document.getElementById('container'), {
      value: jsCode,
      language: 'javascript',
      fontSize: 18,
      theme: '',
      glyphMargin: true
    })

    editor.onDidChangeCursorPosition(evt => {
      updateBreakDotsEqual()
    })

    setEditor(editor)

    let currLineNumber = null

    editor.onMouseMove(evt => {
      // console.log('mousemove - ', evt)

      // 断点区域 || 行号区域
      if (
        evt.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        evt.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const { position } = evt.target

        if (currLineNumber === null) {
          currLineNumber = position.lineNumber

          mouseEnterLine(position.lineNumber)
        } else {
          if (currLineNumber !== position.lineNumber) {
            mouseLeaveLine(currLineNumber)

            mouseEnterLine(position.lineNumber)

            currLineNumber = position.lineNumber
          }
        }
      } else {
        if (currLineNumber === null) {
          return
        }
        mouseLeaveLine(currLineNumber)
        currLineNumber = null
      }
    })

    editor.onMouseDown(evt => {
      // console.log('onMouseDown', evt)

      // 点击断点时
      if (evt.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const { position } = evt.target

        const dots = getAllBreakDots()
        const currLineDot = dots.find(item => item.range.startLineNumber === position.lineNumber)

        const glyphMarginClassName = currLineDot.options.glyphMarginClassName.includes(Active_Class)
          ? Normal_Class
          : classNames(Normal_Class, Active_Class)

        const newDecorations = [
          {
            range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
            options: { glyphMarginClassName }
          }
        ]

        // 更新断点 UI
        editor.getModel().deltaDecorations([currLineDot.id], newDecorations)
      }
    })

    editor.onMouseLeave(() => {
      const allBreakDots = getAllBreakDots()

      const unActives = allBreakDots.filter(item => !item.options.glyphMarginClassName.includes(Active_Class))

      editor.getModel().deltaDecorations(
        unActives.map(item => item.id),
        []
      )
    })

    editor.onContextMenu(function (e) {
      console.log('contextmenu - ', e)
    })

    function mouseEnterLine(lineNumber: number) {
      // console.log('移入了', lineNumber)

      const allBreakDots = getAllBreakDots()
      if (allBreakDots.some(item => item.range.startLineNumber === lineNumber)) {
        return
      }

      const config: monaco.editor.IModelDeltaDecoration = {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: { glyphMarginClassName: Normal_Class }
      }

      editor.getModel().deltaDecorations([], [config])
    }

    function mouseLeaveLine(lineNumber: number) {
      console.log('移出了', currLineNumber)

      const allBreakDots = getAllBreakDots()
      const currLineDot = allBreakDots.find(item => item.range.startLineNumber === lineNumber)
      if (!currLineDot) {
        return
      }

      if (currLineDot.options.glyphMarginClassName.includes(Active_Class)) {
        return
      }

      editor.getModel().deltaDecorations([currLineDot.id], [])
    }
  }, [])

  const setBreak = (lineNumber: number, glyphMarginClassName: string, isWholeLine = false) => {
    editorRef.current.getModel().deltaDecorations(
      [],
      [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: { glyphMarginClassName, className: Whole_Line_Class, isWholeLine }
        }
      ]
    )
  }

  const getBreakDots = () => {
    const model = editor.getModel()
    model.deltaDecorations

    const des = model.getAllDecorations()

    const breakDots = des.filter(item => item.options.glyphMarginClassName?.includes(Normal_Class))

    console.log(breakDots)
  }

  // 将 让断点的 startLineNumber 与 endLineNumber 都等于 startLineNumber, 并 以 startLineNumber 为准去重
  function updateBreakDotsEqual() {
    const model = editorRef.current.getModel()

    const des = model.getAllDecorations()
    des.forEach(item => {
      if (item.range.startLineNumber !== item.range.endLineNumber) {
        const { startLineNumber } = item.range

        const newDecorations = [
          {
            range: new monaco.Range(startLineNumber, 1, startLineNumber, 1),
            options: { glyphMarginClassName: item.options.glyphMarginClassName }
          }
        ]

        // 更新断点 UI
        model.deltaDecorations([item.id], newDecorations)
      }
    })

    // 去重
    const des2 = model.getAllDecorations()

    for (let i = 0; i < des2.length; i++) {
      const desItem = des2[i]
      if (des2.slice(0, i).find(item => item.range.startLineNumber === desItem.range.startLineNumber)) {
        model.deltaDecorations([desItem.id], [])
      }
    }
  }

  return (
    <>
      <section style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setBreak(5, Normal_Class)} onMouseDown={evt => evt.preventDefault()}>
          set 5行 Normal_Class
        </button>

        <button
          onClick={() => setBreak(7, classNames(Normal_Class, Active_Class))}
          onMouseDown={evt => evt.preventDefault()}
        >
          set 7行 Active_Class
        </button>

        <button
          onClick={() => setBreak(10, classNames(Normal_Class, Active_Class), true)}
          onMouseDown={evt => evt.preventDefault()}
        >
          set 10行 Active_Class + 整行高亮
        </button>

        <button onClick={getBreakDots} onMouseDown={evt => evt.preventDefault()}>
          model
        </button>

        <button onClick={updateBreakDotsEqual} onMouseDown={evt => evt.preventDefault()}>
          updateBreakDotsEqual
        </button>
      </section>

      <div id="container" style={{ width: 1000, height: 800 }}></div>
    </>
  )
}

export default App
