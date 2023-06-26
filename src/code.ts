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
