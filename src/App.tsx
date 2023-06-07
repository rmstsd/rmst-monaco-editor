import { useEffect, useRef, useState } from 'react'

import * as monaco from 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

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

  useEffect(() => {
    console.log('MouseTargetType', monaco.editor.MouseTargetType)

    const editor = monaco.editor.create(document.getElementById('container'), {
      value: jsCode,
      language: 'javascript',
      fontSize: 18,
      theme: '',
      glyphMargin: true
    })

    setEditor(editor)

    const decorationMap: Record<
      number,
      {
        config: monaco.editor.IModelDeltaDecoration
        instance: monaco.editor.IEditorDecorationsCollection
      }
    > = {}

    let currLineNumber = null

    function mouseEnterLine(lineNumber: number) {
      console.log('移入了', lineNumber)

      if (decorationMap[lineNumber]) {
        return
      }

      const config = {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: { glyphMarginClassName: 'myGlyphMarginClass' }
      }

      decorationMap[lineNumber] = {
        config: config,
        instance: editor.createDecorationsCollection([config])
      }
    }

    function mouseLeaveLine(lineNumber: number) {
      console.log('移出了', currLineNumber)

      if (!decorationMap[lineNumber]) {
        return
      }

      if (
        decorationMap[lineNumber].config.options.glyphMarginClassName.includes('myGlyphMarginClass-active')
      ) {
        return
      }

      const curLineDecoration = decorationMap[lineNumber].instance

      curLineDecoration.clear()
      Reflect.deleteProperty(decorationMap, lineNumber)
    }

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

        const newGlyphMarginClassName = decorationMap[
          position.lineNumber
        ].config.options.glyphMarginClassName.includes('myGlyphMarginClass-active')
          ? 'myGlyphMarginClass'
          : 'myGlyphMarginClass myGlyphMarginClass-active'

        decorationMap[position.lineNumber].config.options.glyphMarginClassName = newGlyphMarginClassName

        console.log(
          JSON.parse(JSON.stringify(decorationMap[position.lineNumber].config)).options.glyphMarginClassName
        )

        decorationMap[position.lineNumber].instance.set([decorationMap[position.lineNumber].config])
      }
    })

    editor.onMouseLeave(() => {
      // 清除未设置的断点 UI

      Object.keys(decorationMap).forEach(lineNumber => {
        if (
          !decorationMap[lineNumber].config.options.glyphMarginClassName.includes('myGlyphMarginClass-active')
        ) {
          const curLineDecoration = decorationMap[lineNumber].instance

          curLineDecoration.clear()
          Reflect.deleteProperty(decorationMap, lineNumber)
        }
      })
    })

    editor.onContextMenu(function (e) {
      console.log('contextmenu - ', e)
    })
    // editor.onMouseLeave(function (e) {
    //   console.log('mouseleave', e)
    // })
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

  return (
    <>
      <button onClick={setBreak} onMouseDown={evt => evt.preventDefault()}>
        set
      </button>

      <div id="container" style={{ width: 1000, height: 800 }}></div>
    </>
  )
}

export default App

const jsCode = `
const rect_A = document.querySelector('.rect_A')
const rect_B = document.querySelector('.rect_B')

const overlapRect = document.querySelector('.overlap')

let rect_A_pos
let rect_B_pos
addDrag(rect_A, (left, top, rect) => {
  rect_A_pos = {
    leftTop: { x: left, y: top },
    rightBottom: { x: left + rect.width, y: top + rect.height }
  }

  drawOverlay()
})

addDrag(rect_B, (left, top, rect) => {
  rect_B_pos = {
    leftTop: { x: left, y: top },
    rightBottom: { x: left + rect.width, y: top + rect.height }
  }

  drawOverlay()
})

function addDrag(el, Move) {
  function handleMove(evt) {
    evt.preventDefault()
    const { clientX, clientY } = evt

    const left = clientX - an.left
    const top = clientY - an.top

    el.style.left = left + 'px'
    el.style.top = top + 'px'

    Move(left, top, el?.getBoundingClientRect())
  }

  let an = { left: 0, top: 0 }
  el.addEventListener('mousedown', evt => {
    const { clientX, clientY } = evt

    const rect = el?.getBoundingClientRect()
    an = { left: clientX - rect.left, top: clientY - rect.top }

    document.addEventListener('mousemove', handleMove)
  })

  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', handleMove)
  })
}

function drawOverlay() {
  if (!rect_A_pos || !rect_B_pos) {
    return
  }

  const leftTop = {
    x: Math.max(rect_A_pos.leftTop.x, rect_B_pos.leftTop.x),
    y: Math.max(rect_A_pos.leftTop.y, rect_B_pos.leftTop.y)
  }

  const rightBottom = {
    x: Math.min(rect_A_pos.rightBottom.x, rect_B_pos.rightBottom.x),
    y: Math.min(rect_A_pos.rightBottom.y, rect_B_pos.rightBottom.y)
  }

  let overlapWidth = rightBottom.x - leftTop.x
  let overlayHeight = rightBottom.y - leftTop.y

  if (overlapWidth < 0 || overlayHeight < 0) {
    overlapRect.style.display = 'none'
    return
  }

  overlapRect.style.display = 'initial'

  overlapRect.style.left = leftTop.x + 'px'
  overlapRect.style.top = leftTop.y + 'px'
  overlapRect.style.width = rightBottom.x - leftTop.x + 'px'
  overlapRect.style.height = rightBottom.y - leftTop.y + 'px'
}
`

/**
 * 
 * 
      // 点击行号时
      if (evt.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        return

        const { position } = evt.target
        const decorations = editor.createDecorationsCollection([
          {
            range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
            options: {
              // isWholeLine: true,
              // className: 'myContentClass',
              glyphMarginClassName: 'myGlyphMarginClass',
              glyphMarginHoverMessage: { value: '断点' }
            }
          }
        ])
        console.log(decorations)

        setTimeout(() => {
          decorations.set([
            {
              range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
              options: {
                isWholeLine: true,
                className: 'myContentClass',
                glyphMarginClassName: 'myGlyphMarginClass-2',
                glyphMarginHoverMessage: { value: '断点' }
              }
            }
          ])
          // decorations.clear()
        }, 2000)
      }

      
 */
