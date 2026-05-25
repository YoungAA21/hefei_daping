import request from '../request'

// 产线数据
export function getlineInfo(data) {
    return request({
        url: '/LineInfo/LineInfo',
        method: 'post',
        data
    })
}

// NG图片列表
export function getNgImageList(params) {
    return request({
        url: '/api/NgImageInfo/list',
        method: 'get',
        params
    })
}
