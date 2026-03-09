/**
 * Button 组件
 * 通用按钮组件，支持多种变体和尺寸
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button 组件
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  // 基础样式
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary disabled:opacity-50 disabled:cursor-not-allowed';

  // 变体样式
  const variantStyles = {
    primary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent',
    secondary: 'bg-dark-tertiary text-text-primary border border-border hover:bg-dark-quaternary focus:ring-dark-quaternary',
    danger: 'bg-status-error text-white hover:bg-red-600 focus:ring-status-error',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-dark-tertiary',
    link: 'bg-transparent text-accent hover:text-accent-hover underline-offset-4 hover:underline',
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  // 全宽样式
  const widthStyles = fullWidth ? 'w-full' : '';

  // 加载状态样式
  const loadingStyles = loading ? 'cursor-wait' : '';

  const buttonClass = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles}
    ${loadingStyles}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="ml-2 h-4 w-4" />
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'link']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
};

export default Button;
