import request from '../request'
import { isDemoMode, demoLines, demoStatistics, demoImages } from '../demoData';

// 不传日期、班次时由后端解析当前北京时间班次（包含跨午夜班次）。
export function getShiftDefectStatistics(params, signal) {
    if (isDemoMode()) return Promise.resolve(demoStatistics(params));
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
    if (isDemoMode()) return Promise.resolve(demoLines());
    return request({
        url: '/LineInfo/LineInfo',
        method: 'post',
        data
    })
}

// NG图片列表
export function getNgImageList(params) {
    if (isDemoMode()) return Promise.resolve(demoImages());
    return request({
        url: '/api/NgImageInfo/list',
        method: 'get',
        params
    })
}
