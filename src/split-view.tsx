import {
  ReactNode,
  useCallback,
  useState,
  CSSProperties,
  useEffect,
  isValidElement,
} from 'react'

interface ISplitViewProps {
  className?: string
  style?: CSSProperties
  children: (((width: number, height: number) => ReactNode) | ReactNode)[]
  size: number[]
  onSizeChange?: (size: number[]) => void
  width: number
  height: number
  grow: number[]
  minSize: number[]
  direction?: 'row' | 'column'
}

function useDomEvent<K extends keyof HTMLElementEventMap>(
  element: React.RefObject<HTMLElement> | HTMLElement | Window,
  event: K,
  callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
) {
  useEffect(() => {
    if ('current' in element) {
      element.current?.addEventListener(event, callback)
      return () => element.current?.removeEventListener(event, callback)
    } else {
      element?.addEventListener(event, callback)
      return () => element?.removeEventListener(event, callback)
    }
  }, ['current' in element ? element.current : element, event, callback])
}

function createStyle<S extends { [key: string]: CSSProperties }>(style: S): S {
  return style
}

const styles = createStyle({
  splitView: {
    position: 'relative',
    overflow: 'hidden',
  },
  sashContinter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  sash: {
    position: 'absolute',
    pointerEvents: 'auto',
    touchAction: 'none',
    zIndex: 1,
  },
  sashVertical: {
    top: 0,
    width: 4,
    height: '100%',
    cursor: 'col-resize',
  },
  sashHorizontal: {
    left: 0,
    height: 4,
    width: '100%',
    cursor: 'row-resize',
  },
  viewContinter: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  view: {
    position: 'absolute',
  },
})

const SplitView: React.FunctionComponent<ISplitViewProps> = ({
  className,
  style,
  size,
  onSizeChange,
  children,
  width,
  height,
  grow,
  minSize,
  direction = 'row',
}) => {
  const sashs = []
  const views = []
  const length = size.length

  const [activeSashIndex, setActiveSashIndex] = useState<number>()
  const [startPosition, setStartPosition] = useState<{ x: number; y: number }>()
  const [startSize, setStartSize] = useState<number[]>()

  const positionPropertyName = direction === 'row' ? 'left' : 'top'
  const sizePropertyName = direction === 'row' ? 'width' : 'height'

  let finalSize = [...size]

  const minSizeTotal = minSize.reduce((pre, value) => pre + value, 0)
  const targetSizeTotal = Math.max(
    direction === 'row' ? width : height,
    minSizeTotal
  )
  const sizeOffsetTotal =
    targetSizeTotal - size.reduce((pre, value) => pre + value, 0)
  if (sizeOffsetTotal !== 0) {
    const growTotal = grow.reduce((pre, value) => pre + value, 0)
    const growOffset = grow.map((grow) => {
      return (grow / growTotal) * sizeOffsetTotal
    })
    const newSize = size.map((size, index) => {
      return Math.max(size + growOffset[index], minSize[index])
    })
    const newSizeTotal = newSize.reduce((pre, value) => pre + value, 0)

    let remainingSize = targetSizeTotal - newSizeTotal
    for (let i = newSize.length - 1; i >= 0; i--) {
      const tmp = Math.max(minSize[i], newSize[i] + remainingSize)
      remainingSize -= tmp - newSize[i]
      newSize[i] = tmp
    }
    finalSize = newSize
  }

  const handleSashMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      setActiveSashIndex(index)
      setStartPosition({
        x: e.clientX,
        y: e.clientY,
      })
      setStartSize([...finalSize])
    },
    [finalSize]
  )

  const handleSashMouseUp = useCallback(() => {
    if (typeof activeSashIndex !== 'undefined') setActiveSashIndex(undefined)
  }, [activeSashIndex])
  useDomEvent(window, 'mouseup', handleSashMouseUp)

  const handleSashMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        typeof activeSashIndex !== 'undefined' &&
        startPosition &&
        startSize
      ) {
        let offset =
          direction === 'row'
            ? e.clientX - startPosition.x
            : e.clientY - startPosition.y

        const newSize = [...startSize]

        if (offset > 0) {
          offset =
            startSize[activeSashIndex + 1] -
            Math.max(
              minSize[activeSashIndex + 1],
              startSize[activeSashIndex + 1] - offset
            )
        } else {
          offset =
            Math.max(
              minSize[activeSashIndex],
              startSize[activeSashIndex] + offset
            ) - startSize[activeSashIndex]
        }
        newSize[activeSashIndex] = startSize[activeSashIndex] + offset
        newSize[activeSashIndex + 1] = startSize[activeSashIndex + 1] - offset

        if (typeof onSizeChange === 'function') onSizeChange(newSize)
      }
    },
    [minSize, direction, activeSashIndex, startPosition, startSize]
  )
  useDomEvent(window, 'mousemove', handleSashMouseMove)

  let offset = 0
  for (let i = 0; i < length - 1; i++) {
    offset += finalSize[i]
    const pos = offset - 2
    sashs.push(
      <div
        key={'sash-' + i}
        style={{
          ...styles.sash,
          ...(direction === 'row'
            ? styles.sashVertical
            : styles.sashHorizontal),
          [positionPropertyName]: pos,
        }}
        onMouseDown={(e) => handleSashMouseDown(i, e)}
      />
    )
  }

  offset = 0
  for (let i = 0; i < length; i++) {
    const pos = offset
    views.push(
      <div
        key={'view-' + i}
        style={{
          ...styles.viewContinter,
          ...styles.view,
          left: 0,
          top: 0,
          [positionPropertyName]: pos,
          [sizePropertyName]: finalSize[i],
          pointerEvents:
            typeof activeSashIndex !== 'undefined' ? 'none' : 'auto',
        }}
        draggable={false}
      >
        {isValidElement(children[i])
          ? children[i]
          : (children[i] as any)(
              direction === 'row' ? finalSize[i] : width,
              direction === 'row' ? height : finalSize[i]
            )}
      </div>
    )
    offset += finalSize[i]
  }

  return (
    <div
      className={className}
      style={{ ...styles.splitView, width, height, ...style }}
    >
      {typeof activeSashIndex !== 'undefined' && (
        <style>
          {`* {
          cursor: ${
            direction === 'row' ? 'col-resize' : 'row-resize'
          } !important;
          user-select: none !important;
        }`}
        </style>
      )}
      <div style={{ ...styles.sashContinter }}>{sashs}</div>
      <div style={{ ...styles.viewContinter }}>{views}</div>
    </div>
  )
}

export default SplitView
