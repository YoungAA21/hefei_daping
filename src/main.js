import {createApp} from 'vue'
import './style.css'
import './utils/flexible'
import App from './App.vue'
import router from "./router"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'wow.js/css/libs/animate.css'
import './fonts/icon/iconfont.css'
import {createProdMockServer} from 'vite-plugin-mock/es/createProdMockServer'
import mock from './mock/'
import {createPinia} from 'pinia'

// mock 生产环境时打包
if (process.env.NODE_ENV === 'production') {
    createProdMockServer(mock)
}
const app = createApp(App);

app.use(router).use(createPinia()).use(ElementPlus, {
    locale: zhCn,
}).mount('#app')
