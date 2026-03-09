/**
 * Modal 组件
 * 通用模态框组件
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Modal 组件
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  // 处理 ESC 键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // 处理点击遮罩关闭
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  // 阻止内容区点击冒泡
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
    >
      <div
        ref={contentRef}
        onClick={handleContentClick}
        className={`
          w-full bg-dark-secondary rounded-lg shadow-xl overflow-hidden
          animate-slide-up
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {/* 头部 */}
        {title && (
          <div className={`
            flex items-center justify-between px-6 py-4 border-b border-border
            ${headerClassName}
          `}>
            <h3 className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors duration-150 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className={`
          px-6 py-4 max-h-[70vh] overflow-auto
          ${bodyClassName}
        `}>
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div className={`
            flex items-center justify-end gap-3 px-6 py-4 border-t border-border
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
};

export default Modal;
