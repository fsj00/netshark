/**
 * 数据包服务
 * 处理数据包列表获取、详情查询等操作
 */

import api from './api';

/**
 * 获取数据包列表
 * @param {string} sessionId - 会话ID
 * @param {Object} params - 查询参数
 * @param {number} params.offset - 起始偏移量
 * @param {number} params.limit - 返回数量限制
 * @param {string} params.filter - BPF 过滤表达式
 * @returns {Promise<Object>} 数据包列表 { total, offset, limit, packets }
 */
export const listPackets = async (sessionId, params = {}) => {
  const { offset = 0, limit = 100, filter = '' } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('offset', offset.toString());
  queryParams.append('limit', limit.toString());
  if (filter) {
    queryParams.append('filter', filter);
  }

  return api.get(`/sessions/${sessionId}/packets?${queryParams.toString()}`);
};

/**
 * 获取单个数据包详情
 * @param {string} sessionId - 会话ID
 * @param {number} num - 数据包序号
 * @returns {Promise<Object>} 数据包详情 { num, time, src, dst, protocol, length, info, tree, hex_data }
 */
export const getPacketDetail = async (sessionId, num) => {
  return api.get(`/sessions/${sessionId}/packets/${num}`);
};

/**
 * 获取会话统计信息
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 统计信息 { total_packets, total_bytes, duration, start_time, end_time }
 */
export const getStats = async (sessionId) => {
  return api.get(`/sessions/${sessionId}/stats`);
};

/**
 * 获取协议分布统计
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 协议分布 { total, protocols: [{ protocol, count }] }
 */
export const getProtocols = async (sessionId) => {
  return api.get(`/sessions/${sessionId}/protocols`);
};

/**
 * 批量获取数据包（用于虚拟滚动）
 * @param {string} sessionId - 会话ID
 * @param {number} startIndex - 起始索引
 * @param {number} count - 获取数量
 * @param {string} filter - 过滤表达式
 * @returns {Promise<Array>} 数据包数组
 */
export const fetchPacketsBatch = async (sessionId, startIndex, count, filter = '') => {
  const result = await listPackets(sessionId, {
    offset: startIndex,
    limit: count,
    filter,
  });
  return result.packets || [];
};
