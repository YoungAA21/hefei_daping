# 机房动力环境监控大屏

## 框架

Vue 3 + Vite

## 开发环境

nodejs 14 或者 nodejs 16 

## 安装依赖

```
pnpm i 
```

## 运行

```
npm run dev
```

## 打包

```
npm run build
```

## 七牛云配置
为了提升数据可视化大屏项目的加载速度,项目做了cdn的相关配置,
cdn使用的是七牛,可以在`qiniu-upload-prefiex.js`进行配置,
如果没有配置密钥,打包后不上传七牛,配置密钥后,打包后的文件会自动上传七牛.
[注册申请使用免费的七牛云cdn加速](https://www.wanjunshijie.com/note/4921.html)

### 七牛相关的配置文件有
#### `qiniu-upload-prefiex.js` 

配置文件可以在这里配置七牛云上传的路径 存储空间 密钥 cdn地址等信息.

#### `qiniu.js` 
编译打包后,会通过运行此js将文件上传到七牛云 默认不动

#### `src/config/config.js`
在这里配置调试环境和开发环境的地址 默认不动

#### `vite.config.js`
在这里配置打包后的文件地址  默认不动



