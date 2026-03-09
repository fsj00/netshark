/**
 * UploadArea 组件
 * 文件上传区域组件
 */

import React, { useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { UploadCloud, File, X } from 'lucide-react';
import Button from '@components/common/Button';
import { formatFileSize } from '@utils/format';

/**
 * UploadArea 组件
 */
const UploadArea = ({
  onUpload,
  onFileSelect,
  disabled = false,
  accept = '.pcap,.pcapng,.cap',
  maxSize = 100 * 1024 * 1024, // 100MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * 验证文件
   */
  const validateFile = useCallback((file) => {
    // 验证文件类型
    const validExtensions = ['.pcap', '.pcapng', '.cap'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      return {
        valid: false,
        error: '不支持的文件格式，请上传 .pcap, .pcapng 或 .cap 文件',
      };
    }

    // 验证文件大小
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小超过 ${formatFileSize(maxSize)} 限制`,
      };
    }

    return { valid: true };
  }, [maxSize]);

  /**
   * 处理文件选择
   */
  const handleFile = useCallback((file) => {
    setError(null);
    
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * 处理放置
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  /**
   * 触发文件选择
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * 清除选择的文件
   */
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * 开始上传
   */
  const handleUpload = useCallback(() => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  return (
    <div className="w-full">
      {/* 上传区域 */}
      <div
        onClick={!selectedFile ? triggerFileInput : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-accent bg-accent-light' 
            : 'border-border hover:border-accent hover:bg-dark-tertiary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-status-error bg-status-error/5' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <div className="text-6xl mb-4 opacity-70">📁</div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              拖拽 PCAP 文件到此处
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              或点击选择文件
            </p>
            <p className="text-xs text-text-muted">
              支持 .pcap, .pcapng, .cap 格式，最大 {formatFileSize(maxSize)}
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center bg-dark-tertiary rounded-lg">
              <File className="w-8 h-8 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-secondary">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-2 text-text-muted hover:text-status-error transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="mt-2 text-sm text-status-error">{error}</p>
      )}

      {/* 操作按钮 */}
      {selectedFile && (
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={clearFile}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={disabled}
            icon={UploadCloud}
          >
            开始上传
          </Button>
        </div>
      )}
    </div>
  );
};

UploadArea.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func,
  disabled: PropTypes.bool,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
};

export default UploadArea;
