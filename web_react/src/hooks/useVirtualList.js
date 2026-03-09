/**
 * useVirtualList Hook
 * 提供虚拟滚动功能
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { calculateVirtualItems, calculateScrollToIndex } from '@utils/virtualScroll';

/**
 * 虚拟滚动 Hook
 * @param {Object} options - 配置选项
 * @param {Array} options.items - 数据项数组
 * @param {number} options.itemHeight - 每项高度（像素）
 * @param {number} options.overscan - 额外渲染的项数
 * @returns {Object} 虚拟滚动相关状态和函数
 */
export const useVirtualList = ({
  items = [],
  itemHeight = 40,
  overscan = 5,
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 计算可见项
  const virtualData = useMemo(() => {
    return calculateVirtualItems({
      items,
      itemHeight,
      scrollTop,
      containerHeight,
      overscan,
    });
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  // 处理滚动事件
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback((index, align = 'auto') => {
    if (!containerRef.current) return;

    const targetScrollTop = calculateScrollToIndex({
      index,
      itemHeight,
      align,
      containerHeight,
      currentScrollTop: scrollTop,
    });

    containerRef.current.scrollTop = targetScrollTop;
  }, [itemHeight, containerHeight, scrollTop]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = virtualData.totalHeight;
    }
  }, [virtualData.totalHeight]);

  return {
    // 容器 ref
    containerRef,
    // 可见项数据
    visibleItems: virtualData.visibleItems,
    // 虚拟滚动样式
    virtualStyle: {
      height: virtualData.totalHeight,
      paddingTop: virtualData.offsetY,
    },
    // 当前可见范围
    startIndex: virtualData.startIndex,
    endIndex: virtualData.endIndex,
    // 事件处理
    onScroll: handleScroll,
    // 滚动控制
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    // 当前滚动位置
    scrollTop,
  };
};

export default useVirtualList;
