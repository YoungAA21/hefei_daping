const KEY = 'dashboard-demo';
export const isDemoMode = () => typeof window !== 'undefined' && sessionStorage.getItem(KEY) === '1';
export function enableDemo() { sessionStorage.setItem(KEY, '1'); }
export function exitDemo() { sessionStorage.removeItem(KEY); window.location.assign(`${window.location.pathname}#/login`); window.location.reload(); }

const quantities = [28640, 24350, 19580, 31200, 22750, 16800, 26400, 820, 0];
const points = ['商标纸', '透明纸', '条盒'];
const faults = { 3: ['透明纸'], 6: ['商标纸', '条盒'] };
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function demoStatistics({ line, date = today(), shiftName = '' } = {}) {
  const index = Number(String(line).match(/\d+/)?.[0]) - 1;
  if (index < 0 || index > 8 || !Number.isInteger(index)) return { status: 400, message: '无效产线', data: null };
  const shift = shiftName || (new Date().toLocaleString('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', hour12: false }) < '20' ? '甲班' : '乙班');
  const factor = (shift === '乙班' ? .78 : 1) * (date === today() ? 1 : .91);
  const productionCount = Math.floor(quantities[index] * factor);
  const targetScores = [96, 95, 93, 97, 94, 92, 95];
  const penaltyBudget = (100 - (targetScores[index] ?? 94)) * productionCount / 10000;
  const counts = productionCount === 0 ? [0, 0, 0, 0] : productionCount < 1000 ? [0, 0, 1, 2] : [0, 1, 2, Math.max(0, Math.round((penaltyBudget - 7) * 2))];
  const defects = Object.fromEntries(['烟支破损-X', '商标纸错位-A', '透明纸褶皱-B', '印刷偏移-C'].map((name, i) => [name, counts[i]]));
  const penalty = counts[0] * 10 + counts[1] * 3 + counts[2] * 2 + counts[3] * .5;
  return { status: 200, data: { line: `高${index + 1}`, date, shiftName: shift, productionCount, totalDefectCount: counts.reduce((a, b) => a + b, 0), defects, score: productionCount >= 1000 ? +(100 - penalty / (productionCount / 10000)).toFixed(2) : null } };
}

export function demoLines() {
  return { status: 200, data: quantities.slice(0, 8).map((quantity, i) => ({
    line: `gao${i + 1}`, production: quantity + (i === 7 ? 0 : 36000 + i * 2400), rejectionrate: 45 + i * 23,
    points: points.map(point => ({ point, status: !faults[i + 1]?.includes(point) }))
  })) };
}

export function demoImages() { return { status: 200, data: [], total: 0, message: '演示模式未配置检测照片' }; }
