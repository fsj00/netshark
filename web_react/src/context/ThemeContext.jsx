/**
 * ThemeContext - 主题状态管理
 * 提供深色/浅色主题切换功能
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// 创建 Context
const ThemeContext = createContext(null);

// 主题常量
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const STORAGE_KEY = 'netshark_theme';

/**
 * ThemeProvider 组件
 * 包裹应用，提供主题状态
 */
export const ThemeProvider = ({ children }) => {
  // 主题状态
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取保存的主题
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
      
      // 检测系统偏好
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return THEME_DARK;
      }
    }
    return THEME_DARK; // 默认深色主题
  });

  // 是否为深色主题
  const isDark = theme === THEME_DARK;

  /**
   * 切换主题
   */
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === THEME_DARK ? THEME_LIGHT : THEME_DARK);
  }, []);

  /**
   * 设置深色主题
   */
  const setDarkTheme = useCallback(() => {
    setTheme(THEME_DARK);
  }, []);

  /**
   * 设置浅色主题
   */
  const setLightTheme = useCallback(() => {
    setTheme(THEME_LIGHT);
  }, []);

  // 应用主题到 document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      if (theme === THEME_DARK) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      
      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // 只有在用户没有手动设置时才自动切换
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setTheme(e.matches ? THEME_DARK : THEME_LIGHT);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Context 值
  const value = useMemo(() => ({
    theme,
    isDark,
    isLight: !isDark,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
  }), [theme, isDark, toggleTheme, setDarkTheme, setLightTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * 使用 ThemeContext 的 Hook
 * @returns {Object} ThemeContext 值
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
