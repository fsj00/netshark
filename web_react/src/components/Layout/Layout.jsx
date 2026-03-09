/**
 * Layout 组件
 * 应用整体布局
 */

import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import ToastContainer from './ToastContainer';
import LoadingOverlay from './LoadingOverlay';

/**
 * Layout 组件
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-primary">
      {/* 顶部导航 */}
      <Header />

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Toast 提示容器 */}
      <ToastContainer />

      {/* 全局加载遮罩 */}
      <LoadingOverlay />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
