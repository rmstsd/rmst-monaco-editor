import * as monaco from 'monaco-editor'

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
