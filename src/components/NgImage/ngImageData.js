import { resolveNgImageUrl } from '../../utils/ngImageUrl.js';

export function normalizeNgImage(image) {
  const detected = Array.isArray(image.detectedDefects) ? image.detectedDefects : [];
  const names = detected.map(item => item?.defectName).filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
  // Retain compatibility with other monitoring points still using the old response.
  const fallback = image.defectName || image.defect || '其他';
  const defectNames = [...new Set(names.length ? names : [fallback])];
  return {
    ...image,
    imageUrl: resolveNgImageUrl(image.imageUrl),
    detectedImageUrl: resolveNgImageUrl(image.detectedImageUrl),
    defectNames,
    defect: defectNames.join('；'),
    createTime: image.detectedAt || image.createTime
  };
}

export function resolvePointQueryValue(pointName) {
  const pointMap = {
    '商标纸': 'point1',
    '内道商标纸': 'point1',
    '内岛商标纸': 'point1',
    '卡纸': 'kz',
    '前半条烟透明纸': 'qbtytmz',
    '后半条烟透明纸': 'hbtytmz',
    '内道透明纸': 'ndtmz',
    '内岛透明纸': 'ndtmz',
    '外道透明纸': 'wdtmz'
  };
  const point = String(pointName || '').trim();
  return pointMap[point] || point;
}
