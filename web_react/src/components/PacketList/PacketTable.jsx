/**
 * PacketTable 组件
 * 数据包列表表格组件
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@components/common/Button';
import { formatNumber } from '@utils/format';
import PacketRow from './PacketRow';

/**
 * PacketTable 组件
 */
const PacketTable = ({
  packets = [],
  total = 0,
  offset = 0,
  limit = 100,
  selectedPacket = null,
  onSelectPacket,
  onPageChange,
  loading = false,
  virtualScroll = false,
  visibleItems = [],
  containerRef,
  onScroll,
  virtualStyle,
}) => {
  // 计算分页信息
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  // 处理分页
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  // 列定义
  const columns = useMemo(() => [
    { key: 'num', label: 'No.', width: 'w-16', sortable: true },
    { key: 'time', label: '时间', width: 'w-28', sortable: true },
    { key: 'src', label: '源地址', width: 'w-36', sortable: true },
    { key: 'dst', label: '目标地址', width: 'w-36', sortable: true },
    { key: 'protocol', label: '协议', width: 'w-20', sortable: true },
    { key: 'length', label: '长度', width: 'w-16', sortable: true },
    { key: 'info', label: '信息', width: 'flex-1', sortable: false },
  ], []);

  // 渲染列表内容
  const renderContent = () => {
    if (virtualScroll) {
      return (
        <div
          className="relative"
          style={{ height: virtualStyle?.height }}
        >
          <div style={{ paddingTop: virtualStyle?.paddingTop }}>
            {visibleItems.map((packet) => (
              <PacketRow
                key={packet.num}
                packet={packet}
                isSelected={selectedPacket === packet.num}
                onClick={() => onSelectPacket?.(packet.num)}
                columns={columns}
              />
            ))}
          </div>
        </div>
      );
    }

    return packets.map((packet) => (
      <PacketRow
        key={packet.num}
        packet={packet}
        isSelected={selectedPacket === packet.num}
        onClick={() => onSelectPacket?.(packet.num)}
        columns={columns}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 表头 */}
      <div className="flex items-center px-4 py-2 bg-dark-tertiary border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`${col.width} ${col.sortable ? 'cursor-pointer hover:text-text-primary' : ''}`}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* 列表内容 */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto"
      >
        {loading && packets.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-secondary">
            加载中...
          </div>
        ) : packets.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-secondary">
            暂无数据包
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* 分页 */}
      {!virtualScroll && total > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-dark-secondary">
          <div className="text-sm text-text-secondary">
            显示 {formatNumber(offset + 1)} - {formatNumber(Math.min(offset + packets.length, total))} / {formatNumber(total)} 个数据包
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              icon={ChevronLeft}
            >
              上一页
            </Button>
            
            <span className="text-sm text-text-secondary px-2">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              icon={ChevronRight}
              iconPosition="right"
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 虚拟滚动信息 */}
      {virtualScroll && total > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-dark-secondary">
          <div className="text-sm text-text-secondary">
            共 {formatNumber(total)} 个数据包
          </div>
        </div>
      )}
    </div>
  );
};

PacketTable.propTypes = {
  packets: PropTypes.arrayOf(PropTypes.shape({
    num: PropTypes.number.isRequired,
    time: PropTypes.string,
    src: PropTypes.string,
    dst: PropTypes.string,
    protocol: PropTypes.string,
    length: PropTypes.number,
    info: PropTypes.string,
  })),
  total: PropTypes.number,
  offset: PropTypes.number,
  limit: PropTypes.number,
  selectedPacket: PropTypes.number,
  onSelectPacket: PropTypes.func,
  onPageChange: PropTypes.func,
  loading: PropTypes.bool,
  virtualScroll: PropTypes.bool,
  visibleItems: PropTypes.array,
  containerRef: PropTypes.object,
  onScroll: PropTypes.func,
  virtualStyle: PropTypes.object,
};

export default PacketTable;
