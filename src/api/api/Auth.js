import request from '../request'

// 登录
export function login(data) {
    return request({
        url: '/api/Auth/login',
        method: 'post',
        data
    })
}

// 注册
export function register(data) {
    return request({
        url: '/api/Auth/register',
        method: 'post',
        data
    })
}

// 退出登录
export function logout(token) {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('access_token')

    return request({
        url: '/api/Auth/logout',
        method: 'post',
        data: '',
        headers: authToken ? {
            Authorization: `Bearer ${authToken}`
        } : {}
    })
}
