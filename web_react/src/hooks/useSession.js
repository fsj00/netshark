/**
 * useSession Hook
 * 管理分析会话
 */

import { useState, useCallback, useEffect } from 'react';
import { createSession, getSession, closeSession } from '@services/sessionService';

/**
 * 会话管理 Hook
 * @returns {Object} 会话状态和操作函数
 */
export const useSession = () => {
  // 当前会话
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 会话列表（用于切换）
  const [sessions, setSessions] = useState([]);

  /**
   * 创建新会话
   * @param {string} fileId - 文件ID
   * @param {string} filename - 文件名
   */
  const createNewSession = useCallback(async (fileId, filename) => {
    setLoading(true);
    setError(null);

    try {
      const session = await createSession(fileId);
      const sessionData = {
        ...session,
        filename,
        createdAt: new Date().toISOString(),
      };

      setCurrentSession(session.session_id);
      setSessionInfo(sessionData);

      // 添加到会话列表
      setSessions(prev => {
        const exists = prev.find(s => s.session_id === session.session_id);
        if (exists) return prev;
        return [...prev, sessionData];
      });

      return sessionData;
    } catch (err) {
      setError(err.message || '创建会话失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 切换会话
   * @param {string} sessionId - 会话ID
   */
  const switchSession = useCallback(async (sessionId) => {
    if (sessionId === currentSession) return;

    setLoading(true);
    setError(null);

    try {
      const info = await getSession(sessionId);
      setCurrentSession(sessionId);
      setSessionInfo(info);
    } catch (err) {
      setError(err.message || '切换会话失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  /**
   * 关闭当前会话
   */
  const closeCurrentSession = useCallback(async () => {
    if (!currentSession) return;

    setLoading(true);

    try {
      await closeSession(currentSession);

      // 从列表中移除
      setSessions(prev => prev.filter(s => s.session_id !== currentSession));

      // 清除当前会话
      setCurrentSession(null);
      setSessionInfo(null);
    } catch (err) {
      setError(err.message || '关闭会话失败');
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  /**
   * 关闭指定会话
   * @param {string} sessionId - 会话ID
   */
  const closeSessionById = useCallback(async (sessionId) => {
    try {
      await closeSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));

      // 如果关闭的是当前会话，清除当前会话
      if (sessionId === currentSession) {
        setCurrentSession(null);
        setSessionInfo(null);
      }
    } catch (err) {
      setError(err.message || '关闭会话失败');
      throw err;
    }
  }, [currentSession]);

  /**
   * 将会话添加到列表
   * @param {Object} session - 会话信息
   */
  const addSession = useCallback((session) => {
    setSessions(prev => {
      const exists = prev.find(s => s.session_id === session.session_id);
      if (exists) return prev;
      return [...prev, session];
    });

    if (!currentSession) {
      setCurrentSession(session.session_id);
      setSessionInfo(session);
    }
  }, [currentSession]);

  /**
   * 从列表中移除会话
   * @param {string} sessionId - 会话ID
   */
  const removeSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.session_id !== sessionId));

    if (sessionId === currentSession) {
      setCurrentSession(null);
      setSessionInfo(null);
    }
  }, [currentSession]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 从 localStorage 恢复会话列表
  useEffect(() => {
    try {
      const saved = localStorage.getItem('netshark_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 过滤掉过期的会话（24小时）
        const validSessions = parsed.filter(s => {
          const created = new Date(s.createdAt || s.created_at);
          const now = new Date();
          return (now - created) < 24 * 60 * 60 * 1000;
        });
        setSessions(validSessions);
      }
    } catch {
      // 忽略解析错误
    }
  }, []);

  // 保存会话列表到 localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('netshark_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  return {
    // 状态
    currentSession,
    sessionInfo,
    sessions,
    loading,
    error,

    // 操作
    createNewSession,
    switchSession,
    closeCurrentSession,
    closeSessionById,
    addSession,
    removeSession,
    clearError,
  };
};

export default useSession;
