// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const projectRoot = resolve(__dirname)

export default defineConfig(({ mode }) => {
    // BACKEND_URL is server-side configuration, never a browser-side VITE_* value.
    const env = loadEnv(mode, projectRoot, '')
    const backendTarget = env.BACKEND_URL?.trim()
    let backendUrl
    try {
        backendUrl = new URL(backendTarget)
    } catch {
        throw new Error(`请在 .env.${mode} 或 .env.${mode}.local 中设置有效的 BACKEND_URL，例如 http://127.0.0.1:7804`)
    }
    if (!['http:', 'https:'].includes(backendUrl.protocol) || backendUrl.pathname !== '/' || backendUrl.search || backendUrl.hash || backendUrl.username || backendUrl.password) {
        throw new Error('BACKEND_URL 只能包含 http(s)://主机:端口，不要添加接口路径或账号密码')
    }
    const proxy = Object.fromEntries(['/LineInfo', '/api', '/ngimages'].map(path => [path, {
        target: backendUrl.origin,
        changeOrigin: true
    }]))
    const logTarget = server => {
        server.config.logger.info(`[${mode}] /LineInfo、/api、/ngimages -> ${backendUrl.origin}`)
    }
    return {
        plugins: [vue(), {
            name: 'backend-proxy-info',
            configureServer: logTarget,
            configurePreviewServer: logTarget
        }],
        server: { proxy },
        preview: { proxy },
        resolve: {
            alias: { '@': resolve(projectRoot, 'src') }
        }
    }
})
