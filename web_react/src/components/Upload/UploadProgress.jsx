/**
 * UploadProgress 组件
 * 上传进度显示组件
 */

import React from 'react';
import PropTypes from 'prop-types';
import { File, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@components/common/Button';
import { formatFileSize } from '@utils/format';

/**
 * UploadProgress 组件
 */
const UploadProgress = ({
  fileName,
  fileSize,
  progress = 0,
  hashProgress = 0,
  status = 'uploading', // 'uploading' | 'hashing' | 'success' | 'error'
  errorMessage = '',
  onCancel,
  onRetry,
  onClose,
  showHashProgress = false,
}) => {
  const isUploading = status === 'uploading';
  const isHashing = status === 'hashing';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // 计算总进度
  const totalProgress = showHashProgress && isHashing
    ? hashProgress
    : progress;

  // 状态文本
  const getStatusText = () => {
    if (isHashing) return `计算哈希 ${hashProgress}%`;
    if (isUploading) return `上传中 ${progress}%`;
    if (isSuccess) return '上传完成';
    if (isError) return '上传失败';
    return '';
  };

  // 状态颜色
  const getStatusColor = () => {
    if (isSuccess) return 'bg-status-success';
    if (isError) return 'bg-status-error';
    return 'bg-accent';
  };

  return (
    <div className={`
      bg-dark-secondary border rounded-lg p-4
      ${isError ? 'border-status-error' : 'border-border'}
    `}>
      {/* 文件信息和状态 */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0
          ${isSuccess ? 'bg-status-success/10' : isError ? 'bg-status-error/10' : 'bg-dark-tertiary'}
        `}>
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-status-success" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-status-error" />
          ) : (
            <File className="w-5 h-5 text-accent" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {fileName}
          </p>
          <p className="text-xs text-text-secondary">
            {formatFileSize(fileSize)} · {getStatusText()}
          </p>
          {isError && errorMessage && (
            <p className="text-xs text-status-error mt-1">{errorMessage}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isError && onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              重试
            </Button>
          )}
          {(isUploading || isHashing) && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-dark-tertiary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {(isSuccess || isError) && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-dark-tertiary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {(isUploading || isHashing) && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-dark-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${getStatusColor()}`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          
          {/* 双重进度（上传 + 哈希） */}
          {showHashProgress && isUploading && (
            <div className="w-full h-1 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent/50 rounded-full transition-all duration-200"
                style={{ width: `${hashProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 成功状态 */}
      {isSuccess && (
        <div className="flex items-center gap-2 text-sm text-status-success">
          <CheckCircle className="w-4 h-4" />
          <span>文件上传成功，正在创建分析会话...</span>
        </div>
      )}
    </div>
  );
};

UploadProgress.propTypes = {
  fileName: PropTypes.string.isRequired,
  fileSize: PropTypes.number.isRequired,
  progress: PropTypes.number,
  hashProgress: PropTypes.number,
  status: PropTypes.oneOf(['uploading', 'hashing', 'success', 'error']),
  errorMessage: PropTypes.string,
  onCancel: PropTypes.func,
  onRetry: PropTypes.func,
  onClose: PropTypes.func,
  showHashProgress: PropTypes.bool,
};

export default UploadProgress;
