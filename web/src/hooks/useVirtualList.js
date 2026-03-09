import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * 虚拟滚动 Hook
 * @param {Object} options
 * @param {Array} options.items - 数据列表
 * @param {number} options.itemHeight - 每项高度
 * @param {React.RefObject} options.containerRef - 容器 ref
 * @param {number} options.overscan - 额外渲染的项数
 */
function useVirtualList({
  items = [],
  itemHeight = 50,
  containerRef,
  overscan = 3
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // 计算总高度
  const totalHeight = useMemo(() => {
    return items.length * itemHeight
  }, [items.length, itemHeight])

  // 计算可见范围
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    
    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: Math.min(items.length, start + visibleCount + overscan)
    }
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan])

  // 获取可见项
  const virtualItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  // 滚动到指定索引
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight
    }
  }, [containerRef, itemHeight])

  // 监听滚动
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    // 初始化容器高度
    setContainerHeight(container.clientHeight)
    setScrollTop(container.scrollTop)

    container.addEventListener('scroll', handleScroll)
    
    // 监听容器大小变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [containerRef])

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
    scrollTop,
    containerHeight
  }
}

export default useVirtualList
