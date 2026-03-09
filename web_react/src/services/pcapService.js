/**
 * PCAP 文件服务
 * 处理文件上传、列表获取等操作
 */

import api from './api';

/**
 * 上传 PCAP 文件
 * @param {File} file - 文件对象
 * @param {Function} onProgress - 上传进度回调 (progress: number) => void
 * @returns {Promise<Object>} 上传结果 { file_id, filename, size, created_at }
 */
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response;
};

/**
 * 获取文件列表
 * @returns {Promise<Array>} 文件列表 [{ file_id, filename, size, created_at }]
 */
export const listFiles = async () => {
  return api.get('/files');
};

/**
 * 获取单个文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件信息 { file_id, filename, size, created_at }
 */
export const getFile = async (fileId) => {
  return api.get(`/files/${fileId}`);
};

/**
 * 验证文件类型
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为有效的 PCAP 文件
 */
export const isValidPcapFile = (filename) => {
  const validExtensions = ['.pcap', '.pcapng', '.cap'];
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return validExtensions.includes(ext);
};

/**
 * 验证文件大小
 * @param {number} size - 文件大小（字节）
 * @param {number} maxSize - 最大允许大小（字节），默认 100MB
 * @returns {boolean} 是否在允许范围内
 */
export const isValidFileSize = (size, maxSize = 100 * 1024 * 1024) => {
  return size <= maxSize;
};
