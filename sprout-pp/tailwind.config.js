/** @type {import('tailwindcss').Config} */
module.exports = {
    prefix: 'sprout-',
    content: [
        "./contents/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // MCP Design System - Kangkong (Primary Green)
                kangkong: {
                    50: '#F0FDF4',
                    100: '#DCFCE6',
                    200: '#BBF7CE',
                    300: '#86EFA8',
                    400: '#4ADE7B',
                    500: '#22C558',
                    600: '#17AD49',
                    700: '#158039',
                    800: '#166531',
                    900: '#14532B',
                    950: '#052E15',
                },
                // MCP Design System - Mushroom (Neutral Grays)
                mushroom: {
                    50: '#EFF1F1',
                    100: '#E6EAEA',
                    200: '#D9DEDE',
                    300: '#B8C1C0',
                    400: '#919F9D',
                    500: '#738482',
                    600: '#5D6C6B',
                    700: '#4C5857',
                    800: '#414B4B',
                    900: '#394141',
                    950: '#262B2B',
                },
                // MCP Design System - White
                white: {
                    50: '#FFFFFF',
                    100: '#F1F2F3',
                    200: '#DBDBDD',
                    300: '#BABCC0',
                    400: '#989898',
                    500: '#7C7C7C',
                    600: '#656565',
                    700: '#525252',
                    800: '#464646',
                    900: '#3D3D3D',
                    950: '#292929',
                },
                // MCP Design System - Tomato (Error/Danger)
                tomato: {
                    50: '#FEF2F3',
                    100: '#FEE2E3',
                    200: '#FDCBCE',
                    300: '#FBA6AA',
                    400: '#F6737A',
                    500: '#EC4750',
                    600: '#DA2F38',
                    700: '#B61F27',
                    800: '#971D23',
                    900: '#7D1F24',
                    950: '#440B0E',
                },
                // Legacy CSS variable mappings (for compatibility)
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
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                slideIn: {
                    from: { transform: "translateX(100%)" },
                    to: { transform: "translateX(0)" },
                },
                slideOut: {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(100%)" },
                },
                typing: {
                    "0%, 100%": { opacity: "0.3" },
                    "50%": { opacity: "1" },
                },
            },
            animation: {
                slideIn: "slideIn 200ms ease-out",
                slideOut: "slideOut 200ms ease-in",
                typing: "typing 1.4s ease-in-out infinite",
            },
        },
    },
    plugins: [],
}
