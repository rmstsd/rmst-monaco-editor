import { useEffect, useRef, useState } from 'react'

import * as monaco from 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { jsCode } from './code'

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

function App() {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  editorRef.current = editor

  const getAllBreakDots = () => {
    const model = editorRef.current.getModel()
    const des = model.getAllDecorations()

    const breakDots = des.filter(item => item.options.glyphMarginClassName?.includes('myGlyphMarginClass'))

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
      console.log(evt)
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

        const glyphMarginClassName = currLineDot.options.glyphMarginClassName.includes(
          'myGlyphMarginClass-active'
        )
          ? 'myGlyphMarginClass'
          : 'myGlyphMarginClass myGlyphMarginClass-active'

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

      const unActives = allBreakDots.filter(
        item => !item.options.glyphMarginClassName.includes('myGlyphMarginClass-active')
      )

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

      const config = {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: { glyphMarginClassName: 'myGlyphMarginClass' }
      }

      editor.createDecorationsCollection([config])
    }

    function mouseLeaveLine(lineNumber: number) {
      // console.log('移出了', currLineNumber)

      const allBreakDots = getAllBreakDots()

      const currLineDot = allBreakDots.find(item => item.range.startLineNumber === lineNumber)

      if (!currLineDot) {
        return
      }

      if (currLineDot.options.glyphMarginClassName.includes('myGlyphMarginClass-active')) {
        return
      }

      editor.getModel().deltaDecorations([currLineDot.id], [])
    }
  }, [])

  const ref = useRef<monaco.editor.IEditorDecorationsCollection>()
  const setBreak = () => {
    ref.current = editor.createDecorationsCollection([
      {
        range: new monaco.Range(5, 1, 5, 1),
        options: { glyphMarginClassName: 'myGlyphMarginClass' }
      }
    ])
  }

  const getModel = () => {
    const model = editor.getModel()

    model.deltaDecorations

    const des = model.getAllDecorations()

    const breakDots = des.filter(item => item.options.glyphMarginClassName?.includes('myGlyphMarginClass'))

    console.log(breakDots)
  }

  return (
    <>
      <button onClick={setBreak} onMouseDown={evt => evt.preventDefault()}>
        set
      </button>

      <button onClick={getModel} onMouseDown={evt => evt.preventDefault()}>
        model
      </button>

      <div id="container" style={{ width: 1000, height: 800 }}></div>
    </>
  )
}

export default App
