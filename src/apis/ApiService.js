/**
 * 簡單請求
（1) 請求方法是以下三種方法之一：
  HEAD
  GET
  POST
（2）HTTP 的 HEADER 不超出以下幾種型態：
  Accept
  Accept-Language
  Content-Language
  Last-Event-ID
  Content-Type：只限以下三種 application/x-www-form-urlencoded、multipart/form-data、text/plain
 */
import _get from 'lodash/get';
import axios, { CancelToken } from 'axios';
// import httpAdapter from 'axios/lib/adapters/http';
// import AppConfig from '~~config';

function getBlobErrorCode(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const errorCode = e.srcElement.result || '';
      resolve(errorCode);
    };
    reader.onerror = (e) => {
      resolve('');
    };
    reader.readAsText(blob);
  });
}

const API_CONFIG = {
  baseURL: 'https://40008-201-skill.cubewise.asia/api/v1',
  timeout: 10000,
  withCredentials: true,
  // validateStatus: status => (status >= 200 && status <= 500),
};

// // other method: 沒有包成function的方式
const axiosInstance = axios.create(API_CONFIG);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const errorData = _get(error, ['response', 'data'], '');
    if (errorData instanceof Blob) {
      const errorCode = await getBlobErrorCode(errorData);
      if (errorCode) {
        // 把原本的error data替代為error code
        const newError = {
          ...error,
          response: {
            ...error.response,
            data: errorCode,
          },
        };
        return Promise.reject(newError);
      }
    }
    return Promise.reject(error);
  },
);
const ApiService = {
  instance: axiosInstance,

  // withToken = true 要帶上 Authorization 的 header
  mergeHeaders(headers, withToken) {
    let finalHeader = { 
      // "Access-Control-Allow-Origin": "*",
      // 'Accept': 'application/json',
      //   'Content-Type': 'application/json;charset=UTF-8'
    };
    if (withToken) {
      // TODO check token
      const token = `${sessionStorage.getItem('tokentype')} ${sessionStorage.getItem('token')}`;
      if (token) {
        finalHeader = {
          ...finalHeader,
          Authorization: token,
        };
      }
    }
    if (headers) {
      finalHeader = {
        ...finalHeader,
        ...headers,
      };
    }
    return finalHeader;
  },

  // optionsConfig: {params, headers, timeout.....}
  get(url, optionsConfig = {}) {
    const { withToken = false, headers, ...args } = optionsConfig;
    return this.instance({
      method: 'get',
      url,
      headers: this.mergeHeaders(headers, withToken),
      ...args,
    }).catch(this.handleApiError);
  },

  cancelGet(url, optionsConfig = {}) {
    const { withToken = false, headers, ...args } = optionsConfig;
    const source = CancelToken.source();
    return {
      send: () =>
        this.instance({
          method: 'get',
          url,
          headers: this.mergeHeaders(headers, withToken),
          cancelToken: source.token,
          ...args,
        }).catch(this.handleApiError),
      cancel: source.cancel,
    };
  },

  post(url, optionsConfig = {}) {
    const { withToken = false, headers, data, ...args } = optionsConfig;

    return this.instance({
      method: 'post',
      url,
      data,
      headers: this.mergeHeaders(headers, withToken),
      ...args,
    }).catch(this.handleApiError);
  },

  delete(url, optionsConfig = {}) {
    const { withToken = false, headers, data, ...args } = optionsConfig;
    return this.instance({
      method: 'delete',
      url,
      data,
      headers: this.mergeHeaders(headers, withToken),
      ...args,
    }).catch(this.handleApiError);
  },

  put(url, optionsConfig = {}) {
    const { withToken = false, headers, data, ...args } = optionsConfig;
    return this.instance({
      method: 'put',
      url,
      data,
      headers: this.mergeHeaders(headers, withToken),
      ...args,
    }).catch(this.handleApiError);
  },

  patch(url, optionsConfig = {}) {
    const { withToken = false, headers, data, ...args } = optionsConfig;
    return this.instance({
      method: 'patch',
      url,
      data,
      headers: this.mergeHeaders(headers, withToken),
      ...args,
    }).catch(this.handleApiError);
  },

  handleApiError(error) {
    // TODO 這裡可以發aciton，或是把錯誤訊息統一做處理
    const {
      response: { data, status },
    } = error;
    const isTokenExpired = status === 401 && data === 'authorized expire';
    if (!error.response) {
      throw new Error(`Unexpected Error: ${error.message}`);
    } else if (isTokenExpired) {
      sessionStorage.clear();
      throw new Error('authorized expire');
    }

    throw error;
  },
};

export default ApiService;

// const axiosInstance = axios.create(API_CONFIG);
// const apiClient = {
//   instance: axiosInstance,
//   get: axiosInstance.get,
//   post: axiosInstance.post,
//   delete: axiosInstance.delete,
//   put: axiosInstance.put,
//   patch: axiosInstance.patch,
// };
// export default apiClient;

// ref
// 參考架構
// https://github.com/letsdoitworld/World-Cleanup-Day/blob/a1e678de01269e897831475aea88b3084ee78713/mobile-app/src/app/services/Api.js
// https://github.com/abereghici/movie-database-react/blob/487a56b06b01f80a3a2d026626701c8a618f2341/src/app/api/index.js
// https://github.com/itsrimzz1/testApp-expo/blob/48f21ddf815ea76c9d4a0e6c0e83924361623fec/src/app/apiService.js
// https://github.com/kostyanet/mobx-spa/blob/789350545375f4d157866955e9e2640d0d0fd0ee/src/app/services/api.service.js
// https://github.com/tiezo/anon_fl_frontend/blob/4587d568283b0a284eaae50dfedd63b73a513d5f/src/app/api/client.js
// https://github.com/tiezo/anon_fl_frontend/blob/4587d568283b0a284eaae50dfedd63b73a513d5f/src/app/api/resources.js

// https://github.com/innowatio/iwapp/blob/4cc799528a9b121c51dcd1796cc1f658254cd348/app/lib/axios.js
// https://github.com/keita-nishimoto/aws-serverless-prototype
// https://github.com/qiaoyixuan/blog/blob/113544a7802b5e346b97a81b90eb01688b6b3961/public/app/apis/Client.js
