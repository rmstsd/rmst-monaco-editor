export const jsCode = `
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

export const cssCode = `
.break-dot {
  background: #ff7575;
  border-radius: 50%;
  width: 10px !important;
  height: 10px !important;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.break-dot-active {
  background: #ff2222;
}

.whole-line {
  background: lightblue;
}
`

export const scssCode = `
$baseFontSizeInPixels: 14;

@function px2em ($font_size, $base_font_size: $baseFontSizeInPixels) {  
  @return ($font_size / $base_font_size) + em; 
}

h1 {
  font-size: px2em(36, $baseFontSizeInPixels);
}

h2  {  
  @each $animal in puma, sea-slug, egret, salamander {
    .#{$animal}-icon {
      background-image: url('/images/#{$animal}.png');
    }
  }
}`

export const tsCode = `
import * as monaco from 'monaco-editor'

type User = { name: string; age: number }
type MouseLineCallback = (lineNumber: number) => void
export function addLineNumberListener(
  editor: monaco.editor.IStandaloneCodeEditor,
  mouseEnter: MouseLineCallback,
  mouseLeave: MouseLineCallback
) {
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

        mouseEnter(position.lineNumber)
      } else {
        if (currLineNumber !== position.lineNumber) {
          mouseLeave(currLineNumber)

          mouseEnter(position.lineNumber)

          currLineNumber = position.lineNumber
        }
      }
    } else {
      if (currLineNumber === null) {
        return
      }
      mouseLeave(currLineNumber)
      currLineNumber = null
    }
  })
}
`

export const tsxCode = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <App />
  </>
)

`

export const pythonCode = `
def main():
    uu = "ui"

    counts = [1, 2, 3, 4]
    print("log", uu)

    scc = calcSum(counts)
    print("log", scc)


def calcSum(arr):
    if arr == 1:
        pass

    return sum(arr)


main()`
