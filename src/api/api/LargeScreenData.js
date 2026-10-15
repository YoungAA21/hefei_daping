import request from '../request'

// 不传日期、班次时由后端解析当前北京时间班次（包含跨午夜班次）。
export function getShiftDefectStatistics(params, signal) {
    return request({
        url: '/api/ShiftDefectStatistics/by-line',
        method: 'get',
        params,
        signal,
        timeout: 15000
    })
}

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
