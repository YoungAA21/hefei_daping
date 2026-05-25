var url1 = '' // 正式接口
var url2 = 'http://192.168.31.103:7803' // 调试接口
var ip = process.env.NODE_ENV === 'production' ? '' : ''

export const devIp = url2
export const testIp = ip
export const timing = 10000
