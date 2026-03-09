/**
 * 虚拟滚动工具函数
 * 提供虚拟滚动的计算逻辑
 */

/**
 * 计算虚拟滚动的可见项
 * @param {Object} params - 参数
 * @param {Array} params.items - 所有数据项
 * @param {number} params.itemHeight - 每项高度（像素）
 * @param {number} params.scrollTop - 当前滚动位置
 * @param {number} params.containerHeight - 容器高度
 * @param {number} params.overscan - 额外渲染的项数（上下各 overscan 个）
 * @returns {Object} 计算结果
 */
export const calculateVirtualItems = ({
  items,
  itemHeight,
  scrollTop,
  containerHeight,
  overscan = 5,
}) => {
  if (!items || items.length === 0 || containerHeight <= 0) {
    return {
      visibleItems: [],
      startIndex: 0,
      endIndex: 0,
      totalHeight: 0,
      offsetY: 0,
    };
  }

  const totalHeight = items.length * itemHeight;
  
  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  // 计算偏移量
  const offsetY = startIndex * itemHeight;
  
  // 获取可见项
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    _virtualIndex: startIndex + index,
  }));

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  };
};

/**
 * 计算滚动到指定项的位置
 * @param {number} index - 目标项索引
 * @param {number} itemHeight - 每项高度
 * @param {string} align - 对齐方式 ('start' | 'center' | 'end' | 'auto')
 * @param {number} containerHeight - 容器高度
 * @returns {number} 目标滚动位置
 */
export const calculateScrollToIndex = ({
  index,
  itemHeight,
  align = 'auto',
  containerHeight,
  currentScrollTop,
}) => {
  const itemTop = index * itemHeight;
  const itemBottom = itemTop + itemHeight;

  switch (align) {
    case 'start':
      return itemTop;
    
    case 'center':
      return itemTop - containerHeight / 2 + itemHeight / 2;
    
    case 'end':
      return itemBottom - containerHeight;
    
    case 'auto':
    default:
      // 如果项已经在视口内，不需要滚动
      if (itemTop >= currentScrollTop && itemBottom <= currentScrollTop + containerHeight) {
        return currentScrollTop;
      }
      // 如果项在视口上方，滚动到顶部对齐
      if (itemTop < currentScrollTop) {
        return itemTop;
      }
      // 如果项在视口下方，滚动到底部对齐
      return itemBottom - containerHeight;
  }
};

/**
 * 查找最接近指定位置的项索引
 * @param {number} scrollTop - 滚动位置
 * @param {number} itemHeight - 每项高度
 * @returns {number} 项索引
 */
export const findNearestItemIndex = (scrollTop, itemHeight) => {
  return Math.max(0, Math.floor(scrollTop / itemHeight));
};

/**
 * 计算平均项高度（用于可变高度列表）
 * @param {Array<{height: number}>} measuredItems - 已测量的项
 * @returns {number} 平均高度
 */
export const calculateAverageHeight = (measuredItems) => {
  if (!measuredItems || measuredItems.length === 0) {
    return 0;
  }
  
  const totalHeight = measuredItems.reduce((sum, item) => sum + (item.height || 0), 0);
  return totalHeight / measuredItems.length;
};

/**
 * 创建虚拟列表配置
 * @param {Object} options - 配置选项
 * @returns {Object} 配置对象
 */
export const createVirtualListConfig = (options = {}) => {
  const {
    itemHeight = 40,
    overscan = 5,
    estimateTotalItems = 10000,
  } = options;

  return {
    itemHeight,
    overscan,
    estimateTotalItems,
    estimatedTotalHeight: estimateTotalItems * itemHeight,
  };
};

/**
 * 防抖函数（用于滚动事件）
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait = 16) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数（用于滚动事件）
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit = 16) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
