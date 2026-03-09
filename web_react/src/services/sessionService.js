/**
 * 会话服务
 * 处理分析会话的创建、查询和关闭
 */

import api from './api';

/**
 * 创建分析会话
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 会话信息 { session_id, file_id, created_at, expires_at }
 */
export const createSession = async (fileId) => {
  return api.post('/sessions', { file_id: fileId });
};

/**
 * 获取会话信息
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 会话信息 { session_id, file_id, created_at, expires_at }
 */
export const getSession = async (sessionId) => {
  return api.get(`/sessions/${sessionId}`);
};

/**
 * 关闭会话
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 操作结果
 */
export const closeSession = async (sessionId) => {
  return api.delete(`/sessions/${sessionId}`);
};

/**
 * 创建会话并开始分析（组合操作）
 * @param {string} fileId - 文件ID
 * @param {string} filename - 文件名（用于显示）
 * @returns {Promise<Object>} 会话信息和文件名 { session, filename }
 */
export const createSessionAndAnalyze = async (fileId, filename) => {
  const session = await createSession(fileId);
  return {
    session,
    filename,
  };
};
