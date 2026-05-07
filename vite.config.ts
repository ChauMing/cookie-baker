import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// Vite 配置：用 @crxjs/vite-plugin 直接以 manifest.json 为入口构建扩展
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // 允许把 CJS 依赖（如 antd 3 内部的 classnames / mutationobserver-shim）
    // 混合 ESM 处理，避免产物里残留运行期 require()
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
  },
  optimizeDeps: {
    include: ['classnames', 'mutationobserver-shim'],
  },
  server: {
    port: 10086,
    strictPort: true,
    hmr: {
      port: 10086,
    },
  },
});
