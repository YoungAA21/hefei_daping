import axios from 'axios'
import {devIp} from '@/api/ipConfig'

const service = axios.create({
    // 开发环境不设置 baseURL，让代理处理
    baseURL: '',
    timeout: 100000,
})

let isRefreshing = true
let hasNetworkError = false

function notifyApiStatus(type, error) {
    if (typeof window === 'undefined') return

    window.dispatchEvent(new CustomEvent('api-status-change', {
        detail: {
            type,
            status: error?.response?.status,
            message: error?.response?.data?.message || error?.message || '',
            url: error?.config?.url || ''
        }
    }))
}

// request interceptor
service.interceptors.request.use(config => {
    let token = localStorage.getItem('access_token')
    if (token) {
        config.headers['Authorization'] = config.headers['Authorization'] || 'Basic c2FiZXI6c2FiZXJfc2VjcmV0' // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
        config.headers['Blade-Auth'] = token // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
    }
    return config
}, error => {
    return Promise.reject(error)
})

// respone interceptor
service.interceptors.response.use(
    // response => response,
    response => {
        if (hasNetworkError) {
            hasNetworkError = false
            notifyApiStatus('recovered')
        }
        const res = response.data
        return res;
    },
    error => {
        if (error?.response?.data?.code == 401) {
            if (isRefreshing) {
                isRefreshing = false;
                return refreshToken().then((res) => {
                    const data = res.data;
                    if (data.access_token) {
                        localStorage.setItem('access_token', data.access_token)
                        // 已经刷新了token，将所有队列中的请求进行重试
                        window.location.reload();
                    } else {
                        return false;
                    }
                }).catch(() => {
                    return false;
                }).finally(() => {
                    isRefreshing = true
                })
            }
        }
        const isUnavailable = !error?.response || error.code === 'ECONNABORTED' || error.response?.status >= 500
        if (isUnavailable) {
            hasNetworkError = true
            notifyApiStatus('error', error)
        }
        return Promise.reject(error)
    })

// 刷新token请求
function refreshToken() {
    return axios.post(`${devIp}/api/blade-auth/oauth/token?tenantId=000000&username=DP001&password=efc3d451b28e58fdbffde31ec4c37b86&grant_type=password&scope=all&type=account`, null, {
        headers: {
            'Tenant-Id': '000000',
            'Authorization': 'Basic c2FiZXI6c2FiZXJfc2VjcmV0'
        }
    });
}

// 用户登录
export function userLogin(data) {
    return axios.post(`/login`, data)
  }
  

export default service
