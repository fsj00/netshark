/**
 * Input 组件
 * 通用输入框组件
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Input 组件
 */
const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  disabled = false,
  readOnly = false,
  required = false,
  name,
  id,
  className = '',
  size = 'md',
  error = false,
  errorMessage = '',
  label,
  helperText,
  prefix,
  suffix,
  autoFocus = false,
  autoComplete = 'off',
  ...props
}, ref) => {
  // 基础样式
  const baseStyles = 'w-full bg-dark-secondary border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150';

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  // 状态样式
  const stateStyles = error
    ? 'border-status-error focus:border-status-error focus:ring-status-error'
    : 'border-border';

  // 前缀/后缀样式
  const hasPrefix = !!prefix;
  const hasSuffix = !!suffix;
  const prefixSuffixStyles = `${hasPrefix ? 'pl-10' : ''} ${hasSuffix ? 'pr-10' : ''}`;

  const inputClass = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${stateStyles}
    ${prefixSuffixStyles}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={inputClass}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
            {suffix}
          </div>
        )}
      </div>
      {error && errorMessage && (
        <p className="mt-1 text-xs text-status-error">{errorMessage}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDown: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  autoFocus: PropTypes.bool,
  autoComplete: PropTypes.string,
};

export default Input;
