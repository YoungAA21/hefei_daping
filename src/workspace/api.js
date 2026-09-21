import axios from "axios";

// Keep the middle platform's Bearer contract separate from the legacy screen client.
const client = axios.create({ baseURL: "", timeout: 30000 });
client.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export async function api(url, options = {}) {
  try {
    const response = await client({ url, method: "GET", ...options });
    const body = response.data;
    if (typeof body === "string" && /<!doctype|<html/i.test(body))
      throw new Error("服务尚未提供此接口");
    const status = body?.status ?? body?.code;
    if (
      status !== undefined &&
      ![0, 200, 201, 202, 204].includes(Number(status))
    ) {
      const error = new Error(body.message || "操作未成功");
      error.data = body.data;
      error.status = Number(status);
      throw error;
    }
    return body && Object.prototype.hasOwnProperty.call(body, "data")
      ? body.data
      : body;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    const status = error.response?.status || error.status;
    const body = error.response?.data;
    const message =
      status === 401
        ? "登录已过期，请重新登录"
        : status === 404
          ? "当前服务尚未提供此功能，请核对后端版本"
          : body?.message ||
            (typeof body === "string" && !body.includes("<")
              ? body.slice(0, 200)
              : "") ||
            error.message;
    const result = new Error(message || "服务连接失败，请稍后重试");
    result.status = status;
    result.data = body?.data ?? error.data;
    throw result;
  }
}
export const post = (url, data) => api(url, { method: "POST", data });
export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("user_info") || "{}");
  } catch {
    return {};
  }
}
export function userId() {
  const user = currentUser();
  const id = Number(user.userId ?? user.userid ?? user.UserId);
  if (Number.isInteger(id) && id > 0) return id;
  // LoginRecord.id is a session record, never use it as a user ID.
  try {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    const payload = JSON.parse(
      decodeURIComponent(
        escape(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))),
      ),
    );
    const claim =
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ?? payload.sub;
    if (Number.isInteger(Number(claim)) && Number(claim) > 0)
      return Number(claim);
  } catch {}
  throw new Error("登录信息中缺少用户编号，请重新登录");
}
export const types = ["商标纸", "透明纸"];
export const cameras = ["camera0", "camera1", "camera2", "camera3"];
export function pageData(data, page = 1, size = 20, filter = () => true) {
  if (Array.isArray(data)) {
    const items = data.filter(filter);
    return {
      items: items.slice((page - 1) * size, page * size),
      total: items.length,
    };
  }
  if (!data || !Array.isArray(data.items))
    throw new Error("返回格式与接口文档不一致");
  return { items: data.items, total: Number(data.totalCount) || 0 };
}
export function assetUrl(value) {
  if (typeof value !== "string" || !value.trim() || /^[a-z]:[\\/]/i.test(value))
    return "";
  try {
    const url = new URL(value, location.origin);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (/^\/(images|ngimages|detectedimages|api)\//i.test(url.pathname))
      return url.pathname + url.search;
    return `/backend-assets${url.pathname}${url.search}`;
  } catch {
    return "";
  }
}
export function countBy(items, field) {
  const groups = new Map();
  items.forEach((item) => {
    const name = typeof field === "function" ? field(item) : item[field];
    groups.set(name || "未分类", (groups.get(name || "未分类") || 0) + 1);
  });
  return [...groups].map(([name, value]) => ({ name, value }));
}
export const timeText = (value) =>
  value ? String(value).replace("T", " ").slice(0, 19) : "—";
export function validateBoxes(boxes) {
  return boxes.every(
    (b) =>
      Number.isInteger(Number(b.defect)) &&
      Number(b.defect) >= 0 &&
      ["centerX", "centerY", "width", "height"].every((k) =>
        Number.isFinite(Number(b[k])),
      ) &&
      b.width > 0 &&
      b.height > 0 &&
      b.centerX - b.width / 2 >= -1e-6 &&
      b.centerX + b.width / 2 <= 1.000001 &&
      b.centerY - b.height / 2 >= -1e-6 &&
      b.centerY + b.height / 2 <= 1.000001,
  );
}
