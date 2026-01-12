/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Poppins', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: 'rgb(16 185 129)', // Emerald-500
                    50: 'rgb(236 253 245)',
                    100: 'rgb(209 250 229)',
                    200: 'rgb(167 243 208)',
                    300: 'rgb(110 231 183)',
                    400: 'rgb(52 211 153)',
                    500: 'rgb(16 185 129)',
                    600: 'rgb(5 150 105)',
                    700: 'rgb(4 120 87)',
                    800: 'rgb(6 95 70)',
                    900: 'rgb(6 78 59)',
                },
                secondary: {
                    DEFAULT: 'rgb(139 92 246)', // Violet-500
                    50: 'rgb(245 243 255)',
                    100: 'rgb(237 233 254)',
                    200: 'rgb(221 214 254)',
                    300: 'rgb(196 181 253)',
                    400: 'rgb(167 139 250)',
                    500: 'rgb(139 92 246)',
                    600: 'rgb(124 58 237)',
                    700: 'rgb(109 40 217)',
                    800: 'rgb(91 33 182)',
                    900: 'rgb(76 29 149)',
                },
                accent: {
                    DEFAULT: 'rgb(245 158 11)', // Amber-500
                    50: 'rgb(255 251 235)',
                    100: 'rgb(254 243 199)',
                    200: 'rgb(253 230 138)',
                    300: 'rgb(252 211 77)',
                    400: 'rgb(251 191 36)',
                    500: 'rgb(245 158 11)',
                    600: 'rgb(217 119 6)',
                    700: 'rgb(180 83 9)',
                    800: 'rgb(146 64 14)',
                    900: 'rgb(120 53 15)',
                },
                background: 'rgb(var(--background))',
                foreground: 'rgb(var(--foreground))',
                muted: {
                    DEFAULT: 'rgb(var(--muted))',
                    foreground: 'rgb(var(--muted-foreground))',
                },
                border: 'rgb(var(--border))',
                ring: 'rgb(var(--ring))',
                card: {
                    DEFAULT: 'rgb(var(--card))',
                    foreground: 'rgb(var(--card-foreground))',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'gradient-mesh': 'radial-gradient(at 0% 0%, rgb(16 185 129 / 0.2) 0, transparent 50%), radial-gradient(at 100% 100%, rgb(139 92 246 / 0.2) 0, transparent 50%), radial-gradient(at 100% 0%, rgb(245 158 11 / 0.1) 0, transparent 50%)',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                'glow': '0 0 30px rgba(16, 185, 129, 0.3)',
                'glow-lg': '0 0 40px rgba(16, 185, 129, 0.4)',
                'glow-secondary': '0 0 30px rgba(139, 92, 246, 0.3)',
                'glow-accent': '0 0 30px rgba(245, 158, 11, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'slide-in-left': 'slideInLeft 0.4s ease-out',
                'slide-in-right': 'slideInRight 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
                'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                pulseSlow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                bounceSlow: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
};
