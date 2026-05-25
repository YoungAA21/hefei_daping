// 产线VNC配置
export const lineConfig = {
  // 高1产线 - 高7产线（3个监测点）
  gao1: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6081,
      '内道商标纸': 6082,
      '卡纸': 6083
    }
  },
  gao2: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6081,
      '内道商标纸': 6082,
      '卡纸': 6083
    }
  },
  gao3: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6081,
      '内道商标纸': 6082,
      '卡纸': 6083
    }
  },
  gao4: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6104,
      '内道商标纸': 6103,
      '卡纸': 6102
    }
  },
  gao5: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6101,
      '内道商标纸': 6100,
      '卡纸': 6099
    }
  },
  gao6: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6098,
      '内道商标纸': 6097,
      '卡纸': 6096
    }
  },
  gao7: {
    ip: '127.0.0.1',
    portMap: {
      '内道透明纸': 6095,
      '内道商标纸': 6094,
      '卡纸': 6093
    }
  },
  // 高8产线 - 高9产线（6个监测点）
  gao8: {
    ip: '127.0.0.1',
    portMap: {
      '商标纸': 6081,
      '后半条烟透明纸': 6091,
      '前半条烟透明纸': 6090,
      '外道透明纸': 6089,
      '内道透明纸': 6088,
      '卡纸': 6087
    }
  },
  gao9: {
    ip: '127.0.0.1',
    portMap: {
      '商标纸': 6081,
      '后半条烟透明纸': 6085,
      '前半条烟透明纸': 6084,
      '外道透明纸': 6083,
      '内道透明纸': 6082,
      '卡纸': 6081
    }
  }
};

// VNC服务基础URL模板
export const VNC_BASE_URL = 'http://10.163.151.230:8888/vnc/vnc_connect';

/**
 * 获取监测点VNC URL
 * @param {string} line - 产线标识 (gao1, gao2, ..., gao9)
 * @param {string} pointName - 监测点名称
 * @returns {string} VNC URL
 */
export function getVncUrl(line, pointName) {
  const config = lineConfig[line];
  if (!config) {
    console.error(`未找到产线 "${line}" 的配置`);
    return '';
  }

  const port = config.portMap[pointName];
  if (!port) {
    console.error(`未找到监测点 "${pointName}" 在产线 "${line}" 中的端口配置`);
    return '';
  }

  return `${VNC_BASE_URL}?host=${config.ip}&port=${port}&password=123123`;
}

/**
 * 获取产线所有监测点信息
 * @param {string} line - 产线标识
 * @returns {Array} 监测点列表
 */
export function getLinePoints(line) {
  const config = lineConfig[line];
  if (!config) return [];

  return Object.keys(config.portMap).map(pointName => ({
    point: pointName,
    port: config.portMap[pointName]
  }));
}

// 默认导出
export default {
  lineConfig,
  VNC_BASE_URL,
  getVncUrl,
  getLinePoints
};