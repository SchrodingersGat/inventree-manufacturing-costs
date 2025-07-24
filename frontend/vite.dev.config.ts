import { defineConfig, splitVendorChunkPlugin } from 'vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'

/**
 * Vite config to run the frontend plugin in development mode.
 * 
 * This is a very minimal config, and is not meant to be used for production builds.
 * Refer to vite.config.ts for the production build config.
 */
export default defineConfig({
  plugins: [
    viteExternalsPlugin({
      react: 'React',
      'react-dom': 'ReactDOM',
      'ReactDom': 'ReactDOM',
      '@lingui/core': 'LinguiCore',
      '@lingui/react': 'LinguiReact',
      '@mantine/core': 'MantineCore',
      "@mantine/notifications": 'MantineNotifications',
    }),
    splitVendorChunkPlugin(),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ReactDom: 'ReactDOM',
          '@lingui/core': 'LinguiCore',
          '@lingui/react': 'LinguiReact',
          '@mantine/core': 'MantineCore',
          "@mantine/notifications": 'MantineNotifications',
        },
      },
      external: [
        'react',
        'react-dom',
        '@lingui/core',
        '@lingui/react',
        '@mantine/core',
        '@mantine/notifications',
      ],
    }
  },
  server: {
    port: 5174,  // Default port for plugins
    strictPort: true,
    cors: {
      origin: '*',  // Allow all origins for development
    }
  },
})

