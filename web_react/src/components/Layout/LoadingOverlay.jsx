/**
 * LoadingOverlay 组件
 * 全局加载遮罩
 */

import React from 'react';
import { useApp } from '@context/AppContext';

/**
 * LoadingOverlay 组件
 */
const LoadingOverlay = () => {
  const { loading, loadingMessage } = useApp();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-primary bg-opacity-80">
      <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
      {loadingMessage && (
        <p className="mt-4 text-text-secondary">{loadingMessage}</p>
      )}
    </div>
  );
};

export default LoadingOverlay;
