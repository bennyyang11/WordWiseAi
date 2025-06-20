import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    autoprefixer({
      overrideBrowserslist: ['> 1%', 'last 2 versions'],
    }),
  ],
} 