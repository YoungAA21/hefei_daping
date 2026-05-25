// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    server: {
        proxy: {
            '/LineInfo': {  // 代理 /LineInfo 路径
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
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
})
