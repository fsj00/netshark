/**
 * usePackets Hook
 * 管理数据包的加载、过滤和分页
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { listPackets, getPacketDetail } from '@services/packetService';

/**
 * 数据包管理 Hook
 * @param {string} sessionId - 会话ID
 * @returns {Object} 数据包状态和操作函数
 */
export const usePackets = (sessionId) => {
  // 数据状态
  const [packets, setPackets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 分页和过滤状态
  const [offset, setOffset] = useState(0);
  const [limit] = useState(100);
  const [filter, setFilter] = useState('');

  // 选中的数据包
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [packetDetail, setPacketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 缓存已加载的数据包
  const packetCache = useRef(new Map());

  // 加载数据包列表
  const fetchPackets = useCallback(async (newOffset = offset, newFilter = filter) => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await listPackets(sessionId, {
        offset: newOffset,
        limit,
        filter: newFilter,
      });

      setPackets(response.packets || []);
      setTotal(response.total || 0);
      setOffset(newOffset);

      // 更新缓存
      response.packets?.forEach(packet => {
        packetCache.current.set(packet.num, packet);
      });
    } catch (err) {
      setError(err.message || '加载数据包失败');
      setPackets([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, offset, limit, filter]);

  // 加载更多数据包（用于无限滚动）
  const loadMore = useCallback(async () => {
    if (loading || packets.length >= total) return;

    const newOffset = offset + limit;
    setLoading(true);

    try {
      const response = await listPackets(sessionId, {
        offset: newOffset,
        limit,
        filter,
      });

      const newPackets = response.packets || [];
      setPackets(prev => [...prev, ...newPackets]);
      setOffset(newOffset);

      // 更新缓存
      newPackets.forEach(packet => {
        packetCache.current.set(packet.num, packet);
      });
    } catch (err) {
      setError(err.message || '加载更多数据包失败');
    } finally {
      setLoading(false);
    }
  }, [sessionId, offset, limit, filter, loading, packets.length, total]);

  // 应用过滤器
  const applyFilter = useCallback((newFilter) => {
    setFilter(newFilter);
    setOffset(0);
    packetCache.current.clear();
    fetchPackets(0, newFilter);
  }, [fetchPackets]);

  // 清除过滤器
  const clearFilter = useCallback(() => {
    applyFilter('');
  }, [applyFilter]);

  // 选择数据包
  const selectPacket = useCallback(async (num) => {
    setSelectedPacket(num);
    setDetailLoading(true);

    try {
      // 先尝试从缓存获取
      if (packetCache.current.has(num)) {
        setPacketDetail(packetCache.current.get(num));
      }

      // 从服务器获取完整详情
      const detail = await getPacketDetail(sessionId, num);
      setPacketDetail(detail);
      packetCache.current.set(num, detail);
    } catch (err) {
      setError(err.message || '加载数据包详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, [sessionId]);

  // 取消选择
  const deselectPacket = useCallback(() => {
    setSelectedPacket(null);
    setPacketDetail(null);
  }, []);

  // 分页导航
  const goToPage = useCallback((page) => {
    const newOffset = (page - 1) * limit;
    fetchPackets(newOffset);
  }, [limit, fetchPackets]);

  const goToNextPage = useCallback(() => {
    if (offset + limit < total) {
      fetchPackets(offset + limit);
    }
  }, [offset, limit, total, fetchPackets]);

  const goToPrevPage = useCallback(() => {
    if (offset >= limit) {
      fetchPackets(offset - limit);
    }
  }, [offset, limit, fetchPackets]);

  // 初始加载
  useEffect(() => {
    if (sessionId) {
      fetchPackets(0);
    } else {
      setPackets([]);
      setTotal(0);
      setOffset(0);
      setSelectedPacket(null);
      setPacketDetail(null);
      packetCache.current.clear();
    }
  }, [sessionId]);

  // 计算分页信息
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    // 数据
    packets,
    total,
    loading,
    error,

    // 分页
    offset,
    limit,
    currentPage,
    totalPages,

    // 过滤
    filter,

    // 选中
    selectedPacket,
    packetDetail,
    detailLoading,

    // 操作
    fetchPackets,
    loadMore,
    applyFilter,
    clearFilter,
    selectPacket,
    deselectPacket,
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
};

export default usePackets;
