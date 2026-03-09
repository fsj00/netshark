/**
 * useUpload Hook
 * 管理文件上传状态和进度
 */

import { useState, useCallback, useRef } from 'react';
import { uploadFile, isValidPcapFile, isValidFileSize } from '@services/pcapService';
import { calculateSHA256 } from '@utils/sha256';

/**
 * 文件上传 Hook
 * @returns {Object} 上传状态和操作函数
 */
export const useUpload = () => {
  // 上传状态
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hashProgress, setHashProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // 取消令牌
  const abortControllerRef = useRef(null);

  /**
   * 验证文件
   * @param {File} file - 文件对象
   * @returns {Object} 验证结果 { valid: boolean, error?: string }
   */
  const validateFile = useCallback((file) => {
    // 验证文件类型
    if (!isValidPcapFile(file.name)) {
      return {
        valid: false,
        error: '不支持的文件格式，请上传 .pcap, .pcapng 或 .cap 文件',
      };
    }

    // 验证文件大小 (100MB)
    if (!isValidFileSize(file.size)) {
      return {
        valid: false,
        error: '文件大小超过 100MB 限制',
      };
    }

    return { valid: true };
  }, []);

  /**
   * 上传文件
   * @param {File} file - 文件对象
   * @param {Object} options - 选项
   * @param {boolean} options.calculateHash - 是否计算 SHA256
   * @returns {Promise<Object>} 上传结果
   */
  const upload = useCallback(async (file, options = {}) => {
    const { calculateHash = false } = options;

    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      throw new Error(validation.error);
    }

    // 重置状态
    setUploading(true);
    setProgress(0);
    setHashProgress(0);
    setError(null);
    setResult(null);

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      let fileHash = null;

      // 计算 SHA256（可选）
      if (calculateHash) {
        fileHash = await calculateSHA256(file, (progress) => {
          setHashProgress(progress);
        });
      }

      // 上传文件
      const response = await uploadFile(file, (progress) => {
        setProgress(progress);
      });

      const uploadResult = {
        ...response,
        hash: fileHash,
      };

      setResult(uploadResult);
      return uploadResult;
    } catch (err) {
      // 检查是否是取消错误
      if (err.name === 'AbortError' || err.message === 'canceled') {
        setError('上传已取消');
        throw new Error('上传已取消');
      }

      const errorMessage = err.message || '文件上传失败';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [validateFile]);

  /**
   * 取消上传
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setHashProgress(0);
    setError(null);
    setResult(null);
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    uploading,
    progress,
    hashProgress,
    error,
    result,

    // 操作
    upload,
    cancelUpload,
    reset,
    clearError,
    validateFile,
  };
};

export default useUpload;
