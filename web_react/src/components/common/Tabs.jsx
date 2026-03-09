/**
 * Tabs 组件
 * 标签页组件
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Tabs 容器组件
 */
export const Tabs = ({
  children,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  className = '',
  tabClassName = '',
  panelClassName = '',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);
  
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  const handleTabChange = useCallback((tabId) => {
    if (!isControlled) {
      setInternalActiveTab(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  }, [isControlled, onChange]);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        
        return React.cloneElement(child, {
          activeTab,
          onTabChange: handleTabChange,
          tabClassName,
          panelClassName,
        });
      })}
    </div>
  );
};

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTab: PropTypes.string,
  activeTab: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
  tabClassName: PropTypes.string,
  panelClassName: PropTypes.string,
};

/**
 * TabList 组件 - 标签列表
 */
export const TabList = ({
  children,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-border ${className}`}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        
        return React.cloneElement(child, {
          isActive: child.props.id === activeTab,
          onClick: () => onTabChange?.(child.props.id),
        });
      })}
    </div>
  );
};

TabList.propTypes = {
  children: PropTypes.node.isRequired,
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  className: PropTypes.string,
};

/**
 * Tab 组件 - 单个标签
 */
export const Tab = ({
  id,
  children,
  isActive,
  onClick,
  disabled = false,
  icon: Icon,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150
        focus:outline-none
        ${isActive 
          ? 'text-accent border-accent' 
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-dark-tertiary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

Tab.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

/**
 * TabPanels 组件 - 面板容器
 */
export const TabPanels = ({
  children,
  activeTab,
  className = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        
        return React.cloneElement(child, {
          isActive: child.props.id === activeTab,
        });
      })}
    </div>
  );
};

TabPanels.propTypes = {
  children: PropTypes.node.isRequired,
  activeTab: PropTypes.string,
  className: PropTypes.string,
};

/**
 * TabPanel 组件 - 单个面板
 */
export const TabPanel = ({
  id,
  children,
  isActive,
  className = '',
}) => {
  if (!isActive) return null;

  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

TabPanel.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * 简化的 Tabs 组件（组合式）
 */
export const SimpleTabs = ({
  tabs,
  activeTab,
  onChange,
  children,
  className = '',
}) => {
  return (
    <Tabs activeTab={activeTab} onChange={onChange} className={className}>
      <TabList className="mb-4">
        {tabs.map((tab) => (
          <Tab key={tab.id} id={tab.id} icon={tab.icon}>
            {tab.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {children}
      </TabPanels>
    </Tabs>
  );
};

SimpleTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Tabs;
