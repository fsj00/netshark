/**
 * BPFEditor Component
 * BPF 过滤器编辑器组件（基于 CodeMirror 6）
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, 
         drawSelection, dropCursor, rectangularSelection, crosshairCursor,
         highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { SearchIcon, XIcon, CheckIcon, AlertCircleIcon, SparklesIcon } from 'lucide-react';

import Button from '@components/common/Button';
import { bpfHighlighting } from './bpfHighlight';
import { bpfAutocomplete, bpfSnippets } from './bpfAutocomplete';
import { bpfLinter, validateBPFExpression } from './bpfLinter';

/**
 * BPF 编辑器组件
 */
const BPFEditor = ({
  value = '',
  onChange,
  onApply,
  onClear,
  placeholder = '输入 BPF 过滤器 (例如: tcp port 80)',
  disabled = false,
  height = '120px',
  showSnippets = true,
  showValidation = true,
  isDark = true,
  className = '',
}) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [showSnippetPanel, setShowSnippetPanel] = useState(false);

  /**
   * 创建编辑器状态
   */
  const createState = useCallback((doc) => {
    const extensions = [
      // 基础编辑器配置
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      
      // 主题
      isDark ? oneDark : [],
      
      // BPF 语法高亮
      StreamLanguage.define(bpfHighlighting(isDark)),
      
      // 自动补全
      autocompletion({
        override: [bpfAutocomplete()],
        defaultKeymap: true,
        maxRenderedOptions: 15,
      }),
      
      // 括号匹配
      closeBrackets(),
      
      // 语法检查
      showValidation ? bpfLinter() : [],
      showValidation ? lintGutter() : [],
      
      // 按键绑定
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        ...closeBracketsKeymap,
        {
          key: 'Enter',
          run: () => {
            if (onApply && isValid) {
              onApply();
            }
            return true;
          },
        },
        {
          key: 'Mod-Enter',
          run: () => {
            if (onApply && isValid) {
              onApply();
            }
            return true;
          },
        },
      ]),
      
      // 主题样式
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        },
        '.cm-content': {
          padding: '8px 0',
        },
        '.cm-line': {
          padding: '0 8px',
        },
        '.cm-gutters': {
          backgroundColor: isDark ? '#252525' : '#f5f5f5',
          borderRight: `1px solid ${isDark ? '#3d3d3d' : '#e0e0e0'}`,
        },
        '.cm-activeLineGutter': {
          backgroundColor: isDark ? '#2d2d2d' : '#e8e8e8',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? 'rgba(74, 158, 255, 0.1)' : 'rgba(74, 158, 255, 0.05)',
        },
        '.cm-selectionMatch': {
          backgroundColor: isDark ? 'rgba(74, 158, 255, 0.2)' : 'rgba(74, 158, 255, 0.15)',
        },
        '.cm-tooltip': {
          backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
          border: `1px solid ${isDark ? '#3d3d3d' : '#e0e0e0'}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
        '.cm-tooltip.cm-tooltip-autocomplete': {
          '& > ul': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '13px',
          },
          '& > ul > li': {
            padding: '6px 12px',
          },
          '& > ul > li[aria-selected]': {
            backgroundColor: isDark ? '#4a9eff' : '#1976d2',
          },
        },
        '.cm-completionIcon': {
          width: '16px',
          height: '16px',
          marginRight: '8px',
        },
        '.cm-completionIcon-keyword': {
          color: '#4caf50',
        },
        '.cm-completionIcon-modifier': {
          color: '#00bcd4',
        },
        '.cm-completionIcon-operator': {
          color: '#9c27b0',
        },
        '.cm-completionIcon-function': {
          color: '#ff9800',
        },
        '.cm-completionIcon-property': {
          color: '#e91e63',
        },
        '.cm-completionDetail': {
          color: isDark ? '#888' : '#666',
          fontSize: '0.85em',
          marginLeft: '8px',
        },
        '.cm-completionInfo': {
          padding: '8px 12px',
          color: isDark ? '#a0a0a0' : '#666',
          fontSize: '12px',
          borderTop: `1px solid ${isDark ? '#3d3d3d' : '#e0e0e0'}`,
        },
        '.cm-diagnostic': {
          padding: '4px 8px',
        },
        '.cm-diagnostic-error': {
          color: '#f44336',
        },
        '.cm-diagnostic-warning': {
          color: '#ff9800',
        },
        '.cm-gutter-lint': {
          width: '16px',
        },
        '.cm-lint-marker': {
          width: '12px',
          height: '12px',
        },
        '.cm-lint-marker-error': {
          color: '#f44336',
        },
        '.cm-lint-marker-warning': {
          color: '#ff9800',
        },
      }),
      
      // 更新回调
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          
          // 验证表达式
          if (showValidation) {
            const validation = validateBPFExpression(newValue);
            setIsValid(validation.valid);
            if (!validation.valid && validation.diagnostics.length > 0) {
              setValidationMessage(validation.diagnostics[0].message);
            } else {
              setValidationMessage('');
            }
          }
          
          // 触发 onChange
          if (onChange) {
            onChange(newValue);
          }
        }
      }),
      
      // 占位符
      placeholder ? placeholderExtension(placeholder) : [],
    ];

    return EditorState.create({
      doc,
      extensions,
    });
  }, [isDark, onChange, onApply, isValid, showValidation, placeholder]);

  /**
   * 初始化编辑器
   */
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const state = createState(value);
    
    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    // 初始验证
    if (showValidation) {
      const validation = validateBPFExpression(value);
      setIsValid(validation.valid);
    }

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  /**
   * 同步外部 value 变化
   */
  useEffect(() => {
    if (!viewRef.current) return;
    
    const currentValue = viewRef.current.state.doc.toString();
    if (value !== currentValue) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  /**
   * 应用代码片段
   */
  const applySnippet = useCallback((snippet) => {
    if (!viewRef.current) return;
    
    const view = viewRef.current;
    const template = snippet.template;
    
    // 插入模板
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: template,
      },
    });
    
    // 聚焦编辑器
    view.focus();
    
    setShowSnippetPanel(false);
  }, []);

  /**
   * 清空过滤器
   */
  const handleClear = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: '',
        },
      });
    }
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 编辑器容器 */}
      <div className="relative">
        <div
          ref={editorRef}
          className={`
            rounded-lg overflow-hidden border transition-colors duration-200
            ${isDark ? 'border-border bg-dark-secondary' : 'border-gray-300 bg-white'}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
            ${!isValid && showValidation ? 'border-status-error' : ''}
          `}
          style={{ height }}
        />
        
        {/* 验证状态指示器 */}
        {showValidation && value && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isValid ? (
              <CheckIcon className="w-4 h-4 text-status-success" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-status-error" />
            )}
          </div>
        )}
      </div>

      {/* 验证消息 */}
      {showValidation && validationMessage && (
        <div className="flex items-center gap-2 text-xs text-status-error">
          <AlertCircleIcon className="w-3 h-3" />
          <span>{validationMessage}</span>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 代码片段按钮 */}
          {showSnippets && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSnippetPanel(!showSnippetPanel)}
                icon={SparklesIcon}
              >
                代码片段
              </Button>
              
              {/* 代码片段面板 */}
              {showSnippetPanel && (
                <div 
                  className={`
                    absolute top-full left-0 mt-1 z-50 w-72 rounded-lg shadow-lg border
                    ${isDark ? 'bg-dark-secondary border-border' : 'bg-white border-gray-200'}
                  `}
                >
                  <div className="p-2 max-h-64 overflow-auto">
                    <div className="text-xs font-medium text-text-secondary mb-2 px-2">
                      常用过滤器
                    </div>
                    {bpfSnippets.map((snippet) => (
                      <button
                        key={snippet.label}
                        onClick={() => applySnippet(snippet)}
                        className={`
                          w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                          ${isDark 
                            ? 'hover:bg-dark-tertiary text-text-primary' 
                            : 'hover:bg-gray-100 text-gray-900'}
                        `}
                      >
                        <div className="font-medium">{snippet.displayLabel}</div>
                        <div className={`
                          text-xs mt-0.5 font-mono
                          ${isDark ? 'text-text-muted' : 'text-gray-500'}
                        `}>
                          {snippet.template}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 清空按钮 */}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={XIcon}
            >
              清空
            </Button>
          )}
          
          {/* 应用按钮 */}
          <Button
            variant="primary"
            size="sm"
            onClick={onApply}
            disabled={disabled || !isValid}
            loading={disabled}
            icon={SearchIcon}
          >
            应用过滤
          </Button>
        </div>
      </div>

      {/* 点击外部关闭代码片段面板 */}
      {showSnippetPanel && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowSnippetPanel(false)}
        />
      )}
    </div>
  );
};

/**
 * 占位符扩展
 */
function placeholderExtension(text) {
  return EditorView.decorations.compute(['doc'], (state) => {
    if (state.doc.length > 0) return Decoration.none;
    
    const widget = document.createElement('span');
    widget.className = 'cm-placeholder';
    widget.textContent = text;
    widget.style.cssText = `
      color: #666;
      font-style: italic;
      pointer-events: none;
    `;
    
    return Decoration.set([
      Decoration.widget({
        widget: { toDOM: () => widget },
        side: 1,
      }).range(0),
    ]);
  });
}

/**
 * 缩进处理
 */
function indentOnInput() {
  return EditorState.transactionExtender.of((tr) => {
    if (!tr.docChanged) return null;
    
    const changes = [];
    tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      const text = inserted.toString();
      if (text.includes('\n')) {
        // 自动缩进
        const line = tr.startState.doc.lineAt(fromA);
        const indent = /^\s*/.exec(line.text)?.[0] || '';
        
        if (indent) {
          const pos = fromB + text.indexOf('\n') + 1;
          changes.push({ from: pos, insert: indent });
        }
      }
    });
    
    return changes.length > 0 ? { changes } : null;
  });
}

import { Decoration } from '@codemirror/view';

BPFEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onApply: PropTypes.func,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  height: PropTypes.string,
  showSnippets: PropTypes.bool,
  showValidation: PropTypes.bool,
  isDark: PropTypes.bool,
  className: PropTypes.string,
};

export default BPFEditor;
