/**
 * SHA256 计算工具
 * 用于计算文件的 SHA256 哈希值
 */

/**
 * 计算文件的 SHA256 哈希值
 * @param {File} file - 文件对象
 * @param {Function} onProgress - 进度回调 (progress: number) => void
 * @returns {Promise<string>} SHA256 哈希值（十六进制字符串）
 */
export const calculateSHA256 = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    
    const fileReader = new FileReader();
    const crypto = window.crypto || window.msCrypto;
    const subtle = crypto.subtle;
    
    // 用于增量计算哈希
    let buffer = new ArrayBuffer(0);
    
    const loadNextChunk = () => {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      fileReader.readAsArrayBuffer(chunk);
    };
    
    fileReader.onload = async (e) => {
      try {
        const chunkBuffer = e.target.result;
        
        // 合并缓冲区
        const newBuffer = new Uint8Array(buffer.byteLength + chunkBuffer.byteLength);
        newBuffer.set(new Uint8Array(buffer), 0);
        newBuffer.set(new Uint8Array(chunkBuffer), buffer.byteLength);
        buffer = newBuffer.buffer;
        
        currentChunk++;
        
        // 报告进度
        if (onProgress) {
          const progress = Math.round((currentChunk / chunks) * 100);
          onProgress(progress);
        }
        
        if (currentChunk < chunks) {
          loadNextChunk();
        } else {
          // 所有块读取完成，计算哈希
          const hashBuffer = await subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    loadNextChunk();
  });
};

/**
 * 计算字符串的 SHA256 哈希值
 * @param {string} str - 输入字符串
 * @returns {Promise<string>} SHA256 哈希值
 */
export const calculateSHA256FromString = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const crypto = window.crypto || window.msCrypto;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 格式化哈希值显示（缩短形式）
 * @param {string} hash - 完整哈希值
 * @param {number} length - 显示长度（前后各 length/2 个字符）
 * @returns {string} 缩短的哈希值
 */
export const formatHash = (hash, length = 16) => {
  if (!hash || hash.length <= length) return hash;
  const half = Math.floor(length / 2);
  return `${hash.slice(0, half)}...${hash.slice(-half)}`;
};
