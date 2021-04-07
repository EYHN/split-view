import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import SplitView from './split-view'

const defaultSize = { width: window.innerWidth, height: window.innerHeight }

const App = () => {
  const [size, setSize] = useState<number[]>([
    defaultSize.width * 0.618,
    defaultSize.width * (1 - 0.618),
  ])
  const [innerSize, setInnerSize] = useState<number[]>([
    defaultSize.height * (1 - 0.618),
    defaultSize.height * 0.618,
  ])
  const [innerInnerSize, setInnerInnerSize] = useState<number[]>([
    defaultSize.width * 0.618 * (1 - 0.618),
    defaultSize.width * 0.618 * 0.618,
  ])
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{
    width: number
    height: number
  }>(defaultSize)

  useEffect(() => {
    function updateSize() {
      setContainerSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <SplitView
        minSize={[40, 20]}
        size={size}
        width={containerSize.width}
        height={containerSize.height}
        onSizeChange={setSize}
        grow={[1, 1]}
        direction="row"
      >
        {(width, height) => (
          <SplitView
            minSize={[20, 20]}
            size={innerSize}
            width={width}
            height={height}
            onSizeChange={setInnerSize}
            grow={[1, 1]}
            direction="column"
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#C7C676',
              }}
            ></div>
            {(width, height) => (
              <SplitView
                minSize={[20, 20]}
                size={innerInnerSize}
                width={width}
                height={height}
                onSizeChange={setInnerInnerSize}
                grow={[1, 1]}
                direction="row"
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: '#BF9086',
                  }}
                ></div>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: '#2A8AB4',
                  }}
                ></div>
              </SplitView>
            )}
          </SplitView>
        )}
        <div
          style={{ width: '100%', height: '100%', background: '#988DAD' }}
        ></div>
      </SplitView>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
