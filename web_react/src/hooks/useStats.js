/**
 * useStats Hook
 * 管理统计数据
 */

import { useState, useCallback, useEffect } from 'react';
import { getStats, getProtocols } from '@services/packetService';

/**
 * 统计数据 Hook
 * @param {string} sessionId - 会话ID
 * @returns {Object} 统计数据和加载函数
 */
export const useStats = (sessionId) => {
  // 基本统计
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // 协议分布
  const [protocols, setProtocols] = useState([]);
  const [protocolsLoading, setProtocolsLoading] = useState(false);
  const [protocolsError, setProtocolsError] = useState(null);

  // 自动刷新
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  /**
   * 加载基本统计
   */
  const loadStats = useCallback(async () => {
    if (!sessionId) return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const data = await getStats(sessionId);
      setStats(data);
    } catch (err) {
      setStatsError(err.message || '加载统计失败');
    } finally {
      setStatsLoading(false);
    }
  }, [sessionId]);

  /**
   * 加载协议分布
   */
  const loadProtocols = useCallback(async () => {
    if (!sessionId) return;

    setProtocolsLoading(true);
    setProtocolsError(null);

    try {
      const data = await getProtocols(sessionId);
      setProtocols(data.protocols || []);
    } catch (err) {
      setProtocolsError(err.message || '加载协议分布失败');
    } finally {
      setProtocolsLoading(false);
    }
  }, [sessionId]);

  /**
   * 加载所有统计
   */
  const loadAllStats = useCallback(async () => {
    if (!sessionId) return;

    await Promise.all([
      loadStats(),
      loadProtocols(),
    ]);
  }, [sessionId, loadStats, loadProtocols]);

  /**
   * 清除错误
   */
  const clearErrors = useCallback(() => {
    setStatsError(null);
    setProtocolsError(null);
  }, []);

  // 初始加载
  useEffect(() => {
    if (sessionId) {
      loadAllStats();
    } else {
      setStats(null);
      setProtocols([]);
    }
  }, [sessionId, loadAllStats]);

  // 自动刷新
  useEffect(() => {
    if (!sessionId || !autoRefresh) return;

    const interval = setInterval(() => {
      loadAllStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [sessionId, autoRefresh, refreshInterval, loadAllStats]);

  // 计算派生数据
  const statsWithDerived = stats ? {
    ...stats,
    // 平均包大小
    avgPacketSize: stats.total_packets > 0
      ? Math.floor(stats.total_bytes / stats.total_packets)
      : 0,
    // 包速率 (pps)
    packetRate: stats.duration > 0
      ? (stats.total_packets / stats.duration).toFixed(2)
      : 0,
    // 比特率
    bitrate: stats.duration > 0
      ? (stats.total_bytes * 8) / stats.duration
      : 0,
  } : null;

  // 协议分布图表数据
  const protocolChartData = protocols.map(p => ({
    name: p.protocol,
    value: p.count,
  }));

  return {
    // 基本统计
    stats: statsWithDerived,
    statsLoading,
    statsError,

    // 协议分布
    protocols,
    protocolsLoading,
    protocolsError,
    protocolChartData,

    // 自动刷新
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,

    // 操作
    loadStats,
    loadProtocols,
    loadAllStats,
    clearErrors,
  };
};

export default useStats;
