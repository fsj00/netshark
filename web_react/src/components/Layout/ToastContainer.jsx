/**
 * ToastContainer 组件
 * Toast 提示容器
 */

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '@context/AppContext';

/**
 * Toast 图标映射
 */
const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast 样式映射
 */
const toastStyles = {
  success: 'bg-status-success/10 border-status-success text-status-success',
  error: 'bg-status-error/10 border-status-error text-status-error',
  warning: 'bg-status-warning/10 border-status-warning text-status-warning',
  info: 'bg-status-info/10 border-status-info text-status-info',
};

/**
 * ToastContainer 组件
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];
        
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-lg border min-w-[300px] max-w-[400px]
              animate-slide-up shadow-lg
              ${toastStyles[toast.type]}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
