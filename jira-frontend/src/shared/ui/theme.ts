import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  globalCss: {
    body: {
      bg: '#f4f5f7',
      color: '#172b4d',
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
        body: { value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
