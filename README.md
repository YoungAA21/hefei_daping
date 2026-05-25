下面是一份可直接替换 `README.md` 的完整内容：

```md
# 小包检测监控大屏

基于 Vue 3 + Vite 开发的产线检测监控大屏项目，用于展示产线运行状态、检测点状态、产量、剔除数、NG 率、缺陷图片等数据。

## 技术栈

- Vue 3
- Vite 4
- Vue Router
- Pinia
- Element Plus
- ECharts
- Axios
- GSAP
- Three.js
- Sass
- Mock.js
- postcss-pxtorem

## 环境要求

建议使用：

- Node.js 14 或 Node.js 16
- npm / pnpm

查看当前 Node 版本：

```bash
node -v
```

## 安装依赖

推荐使用 pnpm：

```bash
pnpm install
```

也可以使用 npm：

```bash
npm install
```

## 本地运行

```bash
npm run dev
```

启动后默认访问：

```text
http://localhost:5173/
```

如需指定 host：

```bash
npm run dev -- --host 127.0.0.1
```

## 打包构建

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

## 本地预览构建产物

```bash
npm run preview
```

## 项目目录结构

```text
.
├── dist/                         # 打包产物
├── public/                       # 静态资源
├── src/
│   ├── api/                      # 接口请求封装
│   │   ├── api/
│   │   │   ├── Auth.js
│   │   │   └── LargeScreenData.js
│   │   ├── ipConfig.js
│   │   └── request.js
│   ├── assets/                   # 图片、背景、图标等资源
│   ├── components/               # 通用组件
│   │   ├── pop/                  # 产线/检测点弹窗
│   │   ├── selected/
│   │   ├── tab/
│   │   ├── tabLine/
│   │   ├── videoPop/
│   │   └── VideoPlayer/
│   ├── config/                   # 项目配置
│   ├── fonts/                    # 字体资源
│   ├── mock/                     # Mock 数据
│   ├── router/                   # 路由配置
│   ├── store/                    # Pinia 状态管理
│   ├── utils/                    # 工具方法
│   ├── view/                     # 页面
│   │   ├── home.vue              # 首页大屏
│   │   ├── detail.vue            # 产线详情页
│   │   ├── 3DModel.vue           # 3D 产线页
│   │   ├── login.vue             # 登录页
│   │   └── register.vue          # 注册页
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── package.json
├── vite.config.js
└── README.md
```

## 页面路由

项目使用 `vue-router` 的 hash 路由模式。

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `#/login` | 登录页 | 用户登录 |
| `#/register` | 注册页 | 用户注册 |
| `#/` | 首页大屏 | 产线总览 |
| `#/detail` | 产线详情页 | 当前产线详情、检测点、NG 图片 |
| `#/3DModel` | 3D 产线页 | 3D 产线展示 |

首页、详情页、3D 页面需要登录态。

路由守卫读取：

```js
localStorage.getItem('token') || localStorage.getItem('access_token')
```

没有 token 时会跳转到登录页。

## 接口代理配置

开发环境代理配置位于：

```text
vite.config.js
```

当前代理规则：

```js
server: {
  proxy: {
    '/LineInfo': {
      target: 'http://localhost:7804',
      changeOrigin: true,
      secure: false
    },
    '/api': {
      target: 'http://localhost:7804',
      changeOrigin: true,
      secure: false
    }
  }
}
```

因此本地开发时，前端请求：

```text
/LineInfo/LineInfo
/api/NgImageInfo/list
```

会被代理到：

```text
http://localhost:7804
```

## 主要接口

### 产线数据

文件：

```text
src/api/api/LargeScreenData.js
```

接口：

```js
getlineInfo(data)
```

请求地址：

```text
POST /LineInfo/LineInfo
```

用途：

- 获取产线列表
- 获取产线产量
- 获取剔除数
- 获取检测点状态

### NG 图片列表

接口：

```js
getNgImageList(params)
```

请求地址：

```text
GET /api/NgImageInfo/list
```

请求参数示例：

```js
{
  line: '高4',
  brand: '黄山(金皖烟)',
  point: '卡纸',
  camera: '0',
  page: 1,
  pageSize: 100
}
```

返回数据示例：

```json
{
  "code": 200,
  "message": "Get NG images success",
  "data": [
    {
      "name": "20231215_151604_515_2.bmp",
      "imageUrl": "http://localhost:7804/ngimages/内道透明纸/高4/黄山(金皖烟)/0/20260513/20231215_151604_515_2.bmp",
      "defect": "其他",
      "camera": "0",
      "brand": "黄山(金皖烟)",
      "line": "高4",
      "createTime": "2026-05-13T11:56:35"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalCount": 1,
  "totalPages": 1
}
```

## 功能说明

### 首页大屏

首页用于展示多条产线的整体运行情况，包括：

- 产线状态
- 产线产量
- 剔除数
- 检测点异常状态
- 产线入口弹窗

点击产线后可查看该产线的检测点状态，并进入产线详情页。

### 产线详情页

产线详情页展示当前产线的详细信息，包括：

- 当前产线模型
- 检测点气泡
- 产量数据
- 剔除数据
- 检测点状态
- 产线运行数据表

点击检测点后，会打开 NG 图片详情界面。

### NG 图片详情界面

检测点详情已取消远程 VNC 查看，改为展示当前产线检测点的 NG 图片。

界面结构：

- 左侧：产线名称、产量、剔除数、NG 率
- 中间：当前选中的 NG 图片
- 右侧：NG 图片列表
- 点击操作按钮：打开图片放大预览

放大预览界面：

- 左侧：大图
- 右侧：图片详情
    - 产线名称 `line`
    - 时间 `createTime`
    - 缺陷名称 `defect`
    - 牌号 `brand`

默认查询参数：

```js
brand: '黄山(金皖烟)'
camera: '0'
page: 1
pageSize: 100
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务
npm run dev

# 构建生产包
npm run build

# 本地预览生产包
npm run preview

# 构建并上传七牛云
npm run build-qiniu
```

## 开发注意事项

1. 开发环境后端服务需启动在：

```text
http://localhost:7804
```

2. 若接口地址变化，请修改：

```text
vite.config.js
```

3. 如果需要修改调试接口地址，可查看：

```text
src/api/ipConfig.js
src/config/config.js
```

4. 页面采用大屏适配方案，样式中包含 `postcss-pxtorem` 和自定义 `flexible` 逻辑，修改布局时需注意不同分辨率展示效果。

5. 登录态依赖 `localStorage` 中的：

```text
token
access_token
```

6. 项目中部分历史文件存在中文乱码注释，不影响运行，但新增代码建议统一使用 UTF-8 编码保存。

## 构建说明

执行：

```bash
npm run build
```

常见警告：

```text
Browserslist: caniuse-lite is outdated
```

这是 Browserslist 数据过期提示，不影响构建。

```text
Use of eval in node_modules/mockjs/dist/mock.js is strongly discouraged
```

这是 Mock.js 依赖内部警告，不影响当前项目构建。

## 部署说明

构建完成后，将 `dist/` 目录部署到静态资源服务器即可。

如果使用 Nginx，需要支持 hash 路由，一般无需额外重写配置。

示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /LineInfo/ {
        proxy_pass http://localhost:7804;
    }

    location /api/ {
        proxy_pass http://localhost:7804;
    }
}
```

## 项目维护建议

- 新增接口统一放在 `src/api/api/` 下
- 通用请求逻辑统一维护在 `src/api/request.js`
- 页面级组件放在 `src/view/`
- 通用弹窗、选择器、图表容器等放在 `src/components/`
- 大屏样式修改后建议同时检查 1920x1080 分辨率展示效果
- 涉及接口参数变更时，同步更新 README 中的接口说明

## License

Private project.
```