/**
 * Select 组件
 * 通用下拉选择组件
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

/**
 * Select 组件
 */
const Select = forwardRef(({
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = '请选择...',
  disabled = false,
  name,
  id,
  className = '',
  size = 'md',
  error = false,
  errorMessage = '',
  label,
  helperText,
  required = false,
  ...props
}, ref) => {
  // 基础样式
  const baseStyles = 'w-full appearance-none bg-dark-secondary border rounded-md text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150 cursor-pointer';

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 pr-10 text-xs',
    md: 'px-3 py-2 pr-10 text-sm',
    lg: 'px-4 py-3 pr-10 text-base',
  };

  // 状态样式
  const stateStyles = error
    ? 'border-status-error focus:border-status-error focus:ring-status-error'
    : 'border-border';

  const selectClass = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${stateStyles}
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
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className={selectClass}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '16px',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

Select.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default Select;
