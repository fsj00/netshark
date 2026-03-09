/**
 * API 服务 - Axios 实例配置
 * 提供统一的 HTTP 请求处理和错误处理
 */

import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证令牌等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 检查后端返回的业务状态码
    const data = response.data;
    if (data.code !== 0) {
      const error = new Error(data.message || '请求失败');
      error.code = data.code;
      error.response = response;
      return Promise.reject(error);
    }
    return data.data;
  },
  (error) => {
    // 处理 HTTP 错误
    let message = '网络请求失败';
    
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      switch (status) {
        case 400:
          message = '请求参数错误';
          break;
        case 401:
          message = '未授权，请重新登录';
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = `服务器错误 (${status})`;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message = '服务器无响应，请检查网络连接';
    } else {
      // 请求配置出错
      message = error.message;
    }
    
    const customError = new Error(message);
    customError.originalError = error;
    return Promise.reject(customError);
  }
);

export default api;
