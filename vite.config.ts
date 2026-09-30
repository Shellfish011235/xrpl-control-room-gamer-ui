import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Required for correct asset paths on Vercel (and subpath deployments)
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/__nft_ipfs': {
        target: 'https://nftstorage.link',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/__nft_ipfs/, '/ipfs'),
      },
      '/__nft_ipfs_fallback': {
        target: 'https://ipfs.io',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/__nft_ipfs_fallback/, '/ipfs'),
      },
      '/__nft_arweave': {
        target: 'https://arweave.net',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/__nft_arweave/, ''),
      },
      '/__nft_arweave_fallback': {
        target: 'https://turbo-gateway.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (p) => p.replace(/^\/__nft_arweave_fallback/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  }
})
