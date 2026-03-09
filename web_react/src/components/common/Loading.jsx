/**
 * Loading 组件
 * 加载状态组件
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * 加载动画组件
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        inline-block rounded-full border-border border-t-accent animate-spin
        ${sizeStyles[size]}
        ${className}
      `}
    />
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

/**
 * 加载遮罩组件
 */
export const LoadingOverlay = ({ message = '加载中...', fullScreen = false }) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${fullScreen ? 'fixed inset-0 z-50 bg-dark-primary bg-opacity-90' : 'py-12'}
      `}
    >
      <Spinner size={fullScreen ? 'xl' : 'lg'} />
      {message && (
        <p className="mt-4 text-text-secondary">{message}</p>
      )}
    </div>
  );
};

LoadingOverlay.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};

/**
 * 骨架屏组件
 */
export const Skeleton = ({ width, height, circle = false, className = '' }) => {
  return (
    <div
      className={`
        bg-dark-tertiary animate-pulse
        ${circle ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
      style={{ width, height }}
    />
  );
};

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  circle: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * 骨架屏文本组件
 */
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '75%' : '100%'}
          height="1rem"
        />
      ))}
    </div>
  );
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
};

/**
 * 加载状态包装组件
 */
const Loading = ({ loading, children, fallback, message }) => {
  if (loading) {
    return fallback || <LoadingOverlay message={message} />;
  }
  return children;
};

Loading.propTypes = {
  loading: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  message: PropTypes.string,
};

export default Loading;
