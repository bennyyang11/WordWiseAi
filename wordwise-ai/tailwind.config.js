/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{html,js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Essential layout classes
    'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'text-white', 'bg-gray-50', 'bg-gray-100',
    'text-gray-600', 'text-gray-700', 'text-gray-900', 'text-gray-500', 'border-gray-200', 'border-gray-300',
    'flex', 'inline-flex', 'items-center', 'justify-center', 'justify-between', 'gap-2', 'gap-4', 'gap-6',
    'space-y-4', 'space-y-2', 'space-y-6', 'space-x-2', 'space-x-3', 'space-x-4',
    'p-2', 'p-3', 'p-4', 'p-6', 'p-8', 'px-2', 'px-3', 'px-4', 'px-6', 'py-1', 'py-2', 'py-3', 'py-4',
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-6', 'mt-8',
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    'font-medium', 'font-semibold', 'font-bold',
    'border', 'border-0', 'border-2', 'border-t', 'border-b', 'border-l', 'border-r',
    'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full',
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl',
    'w-full', 'h-full', 'min-h-screen', 'min-h-full',
    'container', 'mx-auto', 'my-auto',
    'cursor-pointer', 'cursor-not-allowed',
    'transition-colors', 'transition-all', 'duration-200', 'duration-300',
    'hover:bg-blue-700', 'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:shadow-md',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2',
    'disabled:opacity-50', 'disabled:cursor-not-allowed',
    // Color variations
    'bg-white', 'bg-green-50', 'bg-green-100', 'text-green-600', 'text-green-700', 'text-green-800',
    'bg-red-50', 'bg-red-100', 'text-red-600', 'text-red-700', 'text-red-800',
    'bg-yellow-50', 'bg-yellow-100', 'text-yellow-600', 'text-yellow-700', 'text-yellow-800',
    'bg-purple-50', 'bg-purple-100', 'text-purple-600', 'text-purple-700', 'text-purple-800',
    'border-green-200', 'border-red-200', 'border-yellow-200', 'border-purple-200',
    // Specific component classes
    'btn', 'button', 'card'
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} 