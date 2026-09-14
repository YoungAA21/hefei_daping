export const count = value => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
};

// Use the line identifier, since the service may return a partial or unordered list.
export function normalizeMetrics(list = []) {
  return Array.from({ length: 9 }, (_, index) => {
    const number = index + 1;
    const source = list.find(item => Number(String(item.line || '').match(/^(?:gao|高)\s*(\d+)(?:产线)?$/i)?.[1]) === number);
    const production = count(source?.production);
    const rejected = count(source?.rejectionrate);
    const valid = production !== null && rejected !== null && rejected <= production;
    const quality = valid && production > 0 ? (1 - rejected / production) * 100 : null;
    const fault = source?.points?.some(point => point.status === false);
    return { number, name: `高${number}`, production, rejected, quality, valid,
      state: !source ? 'missing' : fault ? 'fault' : 'normal',
      status: !source ? '未接入' : fault ? '检测异常' : '已接入' };
  });
}

export const formatNumber = value => value === null ? '—' : value.toLocaleString('zh-CN');
export const compactNumber = value => value >= 10000 ? `${+(value / 10000).toFixed(1)}万` : String(value);
