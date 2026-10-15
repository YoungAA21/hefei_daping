// 相同完整缺陷名称跨产线累加；等级后缀不同仍视为不同缺陷类型。
export function aggregateDefects(lines = []) {
  const totals = new Map();
  for (const line of lines) {
    for (const [name, raw] of Object.entries(line?.defects || {})) {
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) totals.set(name, (totals.get(name) || 0) + value);
    }
  }
  const defects = Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'zh-CN'));
  const counts = { X: 0, A: 0, B: 0, C: 0, other: 0 };
  defects.forEach(item => { counts[item.name.match(/-([XABC])$/)?.[1] || 'other'] += item.value; });
  return { defects, counts, total: defects.reduce((sum, item) => sum + item.value, 0) };
}
