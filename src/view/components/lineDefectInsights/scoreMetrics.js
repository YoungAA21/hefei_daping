export const MIN_SCORE_PRODUCTION = 1000;

// 评分门槛使用评分接口的班次产量，与底部实时累计产量独立。
export function normalizeScore(data) {
  const rawProduction = data?.productionCount;
  const parsedProduction = Number(rawProduction);
  const productionCount = rawProduction != null && rawProduction !== '' && Number.isFinite(parsedProduction) && parsedProduction >= 0 ? parsedProduction : null;
  const insufficient = productionCount !== null && productionCount < MIN_SCORE_PRODUCTION;
  const rawScore = data?.score;
  const parsedScore = Number(rawScore);
  const value = productionCount !== null && productionCount >= MIN_SCORE_PRODUCTION && rawScore != null && rawScore !== '' && Number.isFinite(parsedScore) ? parsedScore : null;
  return { productionCount, insufficient, value };
}
