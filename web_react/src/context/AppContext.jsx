/**
 * AppContext - 全局应用状态
 * 提供应用级别的状态管理和操作
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// 创建 Context
const AppContext = createContext(null);

/**
 * AppProvider 组件
 * 包裹应用，提供全局状态
 */
export const AppProvider = ({ children }) => {
  // 全局状态
  const [status, setStatus] = useState('就绪');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  /**
   * 更新状态栏消息
   */
  const updateStatus = useCallback((message) => {
    setStatus(message);
  }, []);

  /**
   * 显示加载遮罩
   */
  const showLoading = useCallback((message = '处理中...') => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  /**
   * 隐藏加载遮罩
   */
  const hideLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  /**
   * 添加 Toast 提示
   */
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // 自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  /**
   * 移除 Toast
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * 显示成功提示
   */
  const showSuccess = useCallback((message, duration) => {
    addToast(message, 'success', duration);
    updateStatus(message);
    setTimeout(() => updateStatus('就绪'), 3000);
  }, [addToast, updateStatus]);

  /**
   * 显示错误提示
   */
  const showError = useCallback((message, duration) => {
    addToast(message, 'error', duration);
    updateStatus(`错误: ${message}`);
  }, [addToast, updateStatus]);

  /**
   * 显示警告提示
   */
  const showWarning = useCallback((message, duration) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  /**
   * 显示信息提示
   */
  const showInfo = useCallback((message, duration) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  // Context 值
  const value = useMemo(() => ({
    // 状态
    status,
    toasts,
    loading,
    loadingMessage,

    // 操作
    updateStatus,
    showLoading,
    hideLoading,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [
    status,
    toasts,
    loading,
    loadingMessage,
    updateStatus,
    showLoading,
    hideLoading,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * 使用 AppContext 的 Hook
 * @returns {Object} AppContext 值
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
