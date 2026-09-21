import test from "node:test";
import assert from "node:assert/strict";
import {
  pageData,
  userId,
  assetUrl,
  validateBoxes,
  countBy,
} from "../src/workspace/api.js";

const values = new Map();
globalThis.localStorage = { getItem: (key) => values.get(key) || null };
globalThis.location = { origin: "http://192.168.1.10:4173" };

test("LoginRecord ID is never confused with the user ID", () => {
  values.set("user_info", JSON.stringify({ id: 900, userId: 4 }));
  assert.equal(userId(), 4);
  values.set("user_info", JSON.stringify({ id: 900 }));
  assert.throws(userId, /用户编号/);
  const payload = Buffer.from(JSON.stringify({ sub: "8" })).toString(
    "base64url",
  );
  values.set("token", `x.${payload}.x`);
  assert.equal(userId(), 8);
  values.clear();
});
test("Legacy full lists filter before pagination; current pages preserve server totals", () => {
  const rows = Array.from({ length: 26 }, (_, id) => ({
    id,
    type: id % 2 ? "A" : "B",
  }));
  const page = pageData(rows, 2, 10, (row) => row.type === "A");
  assert.equal(page.total, 13);
  assert.deepEqual(
    page.items.map((i) => i.id),
    [21, 23, 25],
  );
  assert.deepEqual(pageData({ items: [rows[0]], totalCount: 100 }), {
    items: [rows[0]],
    total: 100,
  });
  assert.throws(() => pageData({ unexpected: [] }), /格式/);
});
test("Server image hosts route through same-origin proxy; local paths and script URLs are rejected", () => {
  assert.equal(
    assetUrl("http://localhost:7804/images/缺陷.jpg"),
    "/images/%E7%BC%BA%E9%99%B7.jpg",
  );
  assert.equal(
    assetUrl("http://localhost:7804/userdata/sample.jpg?q=1"),
    "/backend-assets/userdata/sample.jpg?q=1",
  );
  assert.equal(assetUrl("E:\\data\\image.bmp"), "");
  assert.equal(assetUrl("javascript:alert(1)"), "");
});
test("YOLO rectangles cannot be empty, outside image bounds, or have invalid categories", () => {
  const good = {
    defect: 0,
    centerX: 0.5,
    centerY: 0.5,
    width: 0.2,
    height: 0.2,
  };
  assert.equal(validateBoxes([good]), true);
  assert.equal(validateBoxes([]), true); // Removing all annotations is a supported operation.
  for (const patch of [
    { centerX: 0.01 },
    { width: 0 },
    { height: NaN },
    { defect: -1 },
    { defect: 1.2 },
  ]) {
    assert.equal(validateBoxes([{ ...good, ...patch }]), false);
  }
});
test("Distributions count actual records only", () => {
  assert.deepEqual(
    countBy(
      [{ camera: "camera0" }, { camera: "camera0" }, { camera: "camera1" }],
      "camera",
    ),
    [
      { name: "camera0", value: 2 },
      { name: "camera1", value: 1 },
    ],
  );
});
