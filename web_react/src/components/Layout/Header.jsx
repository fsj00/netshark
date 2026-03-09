/**
 * Header 组件
 * 顶部导航栏
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, FileText, BarChart3, Moon, Sun } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';
import { useApp } from '@context/AppContext';

/**
 * Header 组件
 */
const Header = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { status } = useApp();

  const navItems = [
    { path: '/', label: '上传', icon: Upload },
    { path: '/files', label: '文件', icon: FileText },
    { path: '/analysis', label: '分析', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="h-header bg-dark-secondary border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Logo 和导航 */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-text-primary hover:text-accent transition-colors">
          <span className="text-2xl">🦈</span>
          <span>NetShark</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
                  ${active 
                    ? 'text-accent bg-accent-light' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-tertiary'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-4">
        {/* 状态指示器 */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>{status}</span>
        </div>

        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-tertiary rounded-md transition-colors"
          title={isDark ? '切换到浅色主题' : '切换到深色主题'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
