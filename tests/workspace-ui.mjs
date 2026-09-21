// Runs in a fresh headless browser. Every business API is intercepted; no live writes.
// Set PLAYWRIGHT_MODULE to an installed playwright/index.mjs if it is not in node_modules.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
process.env.BACKEND_URL = "http://127.0.0.1:1";
const server = await createServer({
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  reducedMotion: "reduce",
});
await context.addInitScript(() => {
  localStorage.setItem("token", "isolated-fixture-token");
  localStorage.setItem(
    "user_info",
    JSON.stringify({ userId: 4, username: "测试用户" }),
  );
});
const page = await context.newPage();
const errors = [],
  writes = [];
page.on("pageerror", (error) => errors.push(error.stack || error.message));
const datasets = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  userId: 4,
  name: `商标纸缺陷样本_${String(index + 1).padStart(2, "0")}`,
  brand: "黄山(金皖烟)",
  type: "商标纸",
  camera: `camera${index % 4}`,
  imageCount: 120 + index * 23,
  issub: index % 2 ? "已辅助打标" : "未辅助打标",
  updateTime: "2026-09-21T10:30:00",
}));
const labels = [
  { id: 10, labelname: "折角" },
  { id: 20, labelname: "划痕" },
  { id: 30, labelname: "破损" },
];
const defects = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  uid: `SB-${i + 1}`,
  name: ["商标纸折角", "商标纸划痕", "封口破损"][i % 3],
  type: "小盒",
  subtype: "小盒商标纸",
  level: ["A", "B", "C"][i % 3],
  label: i % 3,
  imagepath: "http://localhost:7804/images/fixture.svg",
  description: "标准缺陷示例，检查包装完整性。",
}));
const models = [
  {
    id: 31,
    name: "JW_SBZ_camera0_v12",
    userid: 4,
    validate: 1,
    brand: "黄山(金皖烟)",
    type: "商标纸",
    camera: "camera0",
    generation: 120,
    createtime: "2026-09-21T10:00:00",
  },
];
const images = Array.from({ length: 13 }, (_, i) => ({
  imageid: i + 1,
  name: `缺陷样本_${i + 1}.bmp`,
  imageurl: "http://localhost:7804/images/fixture.svg",
  valiimageurl: "http://localhost:7804/images/fixture.svg",
  yoloinfos: [
    { defect: 0, centerX: 0.5, centerY: 0.5, width: 0.2, height: 0.2 },
  ],
}));
const productionLines = Array.from({ length: 9 }, (_, i) => ({
  line: `gao${i + 1}`,
  points: [
    { point: "商标纸", status: i === 8 },
    { point: "透明纸", status: i % 4 !== 0 },
    { point: "条盒", status: true },
  ],
}));
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="b"><stop stop-color="#876024"/><stop offset="1" stop-color="#e2cb85"/></linearGradient></defs><rect width="800" height="600" fill="#172c3b"/><rect x="150" y="90" width="500" height="410" rx="5" fill="url(#b)"/><rect x="178" y="118" width="444" height="355" fill="none" stroke="#ece1b4" stroke-width="3"/><text x="400" y="230" text-anchor="middle" font-size="58" fill="#8b2726">黄 山</text><text x="400" y="300" text-anchor="middle" font-size="25" fill="#8b2726">HUANGSHAN</text><path d="M330 370l45 -55 34 40" stroke="#6f4d25" fill="none" stroke-width="7"/><text x="400" y="540" text-anchor="middle" fill="#71a1b7" font-size="15">ISOLATED TEST FIXTURE</text></svg>';
let failDatasets = false;
const paged = (list, u) => {
  const n = Number(u.searchParams.get("page") || 1),
    s = Number(u.searchParams.get("pageSize") || 20);
  return {
    items: list.slice((n - 1) * s, n * s),
    totalCount: list.length,
    page: n,
    pageSize: s,
  };
};
await context.route("**/*", async (route) => {
  const req = route.request(),
    u = new URL(req.url()),
    p = u.pathname;
  if (p.startsWith("/images/") || p.startsWith("/backend-assets/"))
    return route.fulfill({ contentType: "image/svg+xml", body: svg });
  if (!p.startsWith("/api/") && !p.startsWith("/LineInfo"))
    return route.continue();
  const send = (data, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        status,
        message: status === 200 ? "成功" : "测试接口不可用",
        data,
      }),
    });
  if (p === "/LineInfo/LineInfo") return send(productionLines);
  if (req.method() !== "GET") {
    writes.push({ path: p, method: req.method(), body: req.postDataJSON() });
    return send({ id: 50 });
  }
  if (p.includes("BrandCamera/user-datasets"))
    return failDatasets ? send(null, 503) : send(paged(datasets, u));
  if (p.includes("Brand/brandinfo"))
    return send([{ line: "高4", brand: "黄山(金皖烟)" }]);
  if (p.includes("allbasesets"))
    return send(datasets.map((i) => ({ ...i, foldertype: "train" })));
  if (
    p.includes("dataset-images") ||
    p.includes("basesetimages") ||
    p.includes("comparedvaliimages") ||
    p.includes("modeltrainimages")
  )
    return send(paged(images, u));
  if (p.includes("markdefectslabel")) return send(labels);
  if (p.includes("defectsinfo")) return send(defects);
  if (p.includes("modelinfo")) return send(paged(models, u));
  if (p.includes("modeltraininfo"))
    return send([{ ...models[0], trainmsg: "训练中" }]);
  if (p.includes("modelvalinfo"))
    return send(paged([{ ...models[0], valimsg: "验证完毕" }], u));
  if (p.includes("/Auth/username/")) return send("工程师");
  if (p.includes("/Consult/")) return send("名称可用");
  if (p.endsWith("/shifts")) return send(["早班", "中班", "晚班"]);
  if (p.endsWith("/by-line"))
    return send({
      shiftName: "早班",
      startTime: "2026-09-21T08:00:00",
      endTime: "2026-09-21T16:00:00",
      defects: {
        商标纸折角: 126,
        商标纸划痕: 93,
        封口破损: 61,
        印刷偏移: 32,
        包装褶皱: 18,
      },
    });
  if (p.endsWith("/level-counts"))
    return send({ levels: { A: 126, B: 154, C: 50 } });
  return send(null, 404);
});
const root = server.resolvedUrls.local[0];
const output = new URL("../test-results/", import.meta.url);
await mkdir(output, { recursive: true });
try {
  await page.goto(root + "#/workspace/datasets");
  await page
    .getByRole("heading", { name: "缺陷数据采集", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: datasets[0].name, exact: true })
    .waitFor();
  await page.screenshot({
    path: fileURLToPath(new URL("datasets.png", output)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "下一页 →" }).click();
  await page
    .getByRole("heading", { name: datasets[12].name, exact: true })
    .waitFor();
  await page.getByRole("button", { name: "＋ 创建数据集" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("数据集名称").fill("自动化隔离样本");
  await dialog.getByRole("button", { name: "创建数据集", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(writes.at(-1).body.userId, 4);
  assert.notEqual(writes.at(-1).body.camera, "全部");
  await page.getByRole("button", { name: "查看与标注 ↗" }).first().click();
  await page
    .getByRole("heading", { name: "图片标注工作台", exact: true })
    .waitFor();
  await page.locator(".annotation-canvas svg").waitFor();
  await page.getByRole("button", { name: "矩形框选", exact: true }).click();
  const rect = await page.locator(".annotation-canvas svg").boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.1, rect.y + rect.height * 0.1);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.3, rect.y + rect.height * 0.3);
  await page.mouse.up();
  await page.getByRole("button", { name: "保存标注", exact: true }).click();
  await page.getByText("标注已保存", { exact: true }).waitFor();
  const save = writes.findLast((i) => i.path.includes("save-yoloinfos"));
  assert.equal(save.method, "PUT");
  assert.equal(save.body.yoloinfos.length, 2);
  assert.ok(Math.abs(save.body.yoloinfos[1].width - 0.2) < 0.01);
  await page.screenshot({
    path: fileURLToPath(new URL("annotation.png", output)),
    fullPage: true,
  });
  for (const [path, title] of [
    ["basesets", "基础缺陷集"],
    ["defects", "标准缺陷"],
    ["labels", "打标缺陷"],
    ["models", "模型管理"],
    ["quality", "质量分析"],
  ]) {
    await page.goto(root + "#/workspace/" + path);
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.locator(".resource-state.loading").waitFor({ state: "hidden" });
    await page.screenshot({
      path: fileURLToPath(new URL(path + ".png", output)),
      fullPage: true,
    });
    assert.equal(
      await page
        .locator(".ws-main")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 2),
      false,
      `Unexpected main overflow: ${path}`,
    );
  }
  await page.goto(root + "#/workspace/production");
  await page.getByText("检测监控大屏", { exact: true }).waitFor();
  await page.locator(".machine-name span", { hasText: "高9产线" }).waitFor();
  await page.screenshot({
    path: fileURLToPath(new URL("production.png", output)),
    fullPage: true,
  });
  assert.equal(await page.locator(".machine-content").count(), 9);
  await page.goto(root + "#/");
  await page.getByRole("link", { name: "缺陷数据采集" }).waitFor();
  assert.equal(await page.locator(".machine-content").count(), 9);
  await page.goto(root + "#/detail?line=%E9%AB%984");
  await page.getByRole("link", { name: "模型管理" }).waitFor();
  await page.getByText("产线详情", { exact: true }).first().waitFor();
  await page.goto(root + "#/workspace/models");
  await page.getByRole("button", { name: "＋ 创建验证" }).click();
  await page.getByRole("button", { name: "按以上条件加载" }).click();
  await page.getByLabel("验证模型").selectOption(models[0].name);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "提交任务", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(writes.at(-1).path, "/api/Model/createmodelvali");
  assert.equal(writes.at(-1).body.model, models[0].name);
  await page
    .getByRole("button", { name: "查看结果", exact: true })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "模型检测结果", exact: true })
    .waitFor();
  await page.goto(root + "#/workspace/datasets");
  failDatasets = true;
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "测试接口不可用" }).waitFor();
  failDatasets = false;
  await page.getByRole("button", { name: "重新加载", exact: true }).click();
  await page
    .getByRole("heading", { name: datasets[0].name, exact: true })
    .waitFor();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: fileURLToPath(new URL("datasets-1280.png", output)),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 8 workspace routes, embedded production screen, pagination, create dataset, draw/save annotations, validation creation/results, API failure/retry, 1600/1280 layouts; no browser runtime errors.",
  );
} catch (error) {
  console.log("BROWSER ERRORS", errors);
  console.log((await page.locator("body").innerText()).slice(-6000));
  await page.screenshot({
    path: fileURLToPath(new URL("failure.png", output)),
    fullPage: true,
  });
  throw error;
} finally {
  await context.close();
  await browser.close();
  await server.close();
}
