import data from '../../qiniu-upload-prefiex.js'

var developmentUrl = '' // 开发地址
var productionUrl = data.accessKey ? data.prefixhost + data.prefix : developmentUrl //生产地址
var links = process.env.NODE_ENV === 'production' ? productionUrl : developmentUrl

export const link = links
