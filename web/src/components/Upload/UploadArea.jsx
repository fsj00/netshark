import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'

function UploadArea({ onUpload, accept = '.pcap,.pcapng,.cap', maxSize = 100 * 1024 * 1024 }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = (file) => {
    const validExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      return { valid: false, error: `不支持的文件格式，请上传 ${accept} 文件` }
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `文件大小超过 ${(maxSize / 1024 / 1024).toFixed(0)}MB 限制` }
    }
    
    return { valid: true }
  }

  const handleFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(file => {
      const validation = validateFile(file)
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error || null,
        progress: 0
      }
    })
    
    setFiles(prev => [...prev, ...newFiles])
  }, [accept, maxSize])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e) => {
    const selectedFiles = e.target.files
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    e.target.value = ''
  }, [handleFiles])

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)
    
    for (const fileInfo of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { ...f, status: 'uploading' } : f
      ))
      
      try {
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id ? { ...f, progress } : f
          ))
        }
        
        // 调用上传回调
        await onUpload?.(fileInfo.file)
        
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'completed', progress: 100 } : f
        ))
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'error', error: error.message } : f
        ))
      }
    }
    
    setUploading(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragActive
            ? 'border-shark-500 bg-shark-500/10'
            : 'border-dark-border bg-dark-surface hover:border-dark-muted'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-shark-500/20' : 'bg-dark-bg'
          }`}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-shark-400' : 'text-dark-muted'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-dark-text">
              {isDragActive ? '释放以上传文件' : '拖拽 PCAP 文件到此处'}
            </p>
            <p className="text-sm text-dark-muted mt-1">
              或点击选择文件，支持 {accept} 格式
            </p>
          </div>
          
          <p className="text-xs text-dark-muted">
            最大文件大小: {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
            <h3 className="font-medium text-dark-text">
              文件列表 ({files.length})
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : `上传 ${pendingCount} 个文件`}
              </button>
            )}
          </div>
          
          <div className="divide-y divide-dark-border max-h-64 overflow-y-auto">
            {files.map((fileInfo) => (
              <div key={fileInfo.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-bg rounded-lg flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-shark-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-text truncate">
                    {fileInfo.name}
                  </p>
                  <p className="text-xs text-dark-muted">
                    {formatFileSize(fileInfo.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {fileInfo.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-shark-500 transition-all duration-300"
                          style={{ width: `${fileInfo.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {fileInfo.status === 'error' && fileInfo.error && (
                    <p className="text-xs text-red-400 mt-1">{fileInfo.error}</p>
                  )}
                </div>
                
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {fileInfo.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : fileInfo.status === 'error' ? (
                    <X className="w-5 h-5 text-red-500" />
                  ) : (
                    <button
                      onClick={() => removeFile(fileInfo.id)}
                      className="p-1 hover:bg-dark-bg rounded text-dark-muted hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadArea
