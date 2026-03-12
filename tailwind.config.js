/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // DMOJ Brand Colors
                primary: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#f97316", // Main orange
                    600: "#ea580c",
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                    950: "#431407",
                },
                // Rating Colors (based on competitive programming standards)
                rating: {
                    newbie: "#808080", // Gray
                    apprentice: "#008000", // Green
                    specialist: "#03a89e", // Cyan
                    expert: "#0000ff", // Blue
                    master: "#a0a", // Purple
                    international: "#ff8c00", // Orange
                    grandmaster: "#ff8c00", // Orange
                    legendary: "#ff0000", // Red
                },
                // Status Colors
                status: {
                    accepted: "#22c55e", // Green
                    wrong: "#ef4444", // Red
                    pending: "#f59e0b", // Yellow
                    error: "#ef4444", // Red
                    timeout: "#f97316", // Orange
                },
                // Semantic Colors
                success: "#22c55e",
                warning: "#f59e0b",
                error: "#ef4444",
                info: "#3b82f6",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            spacing: {
                18: "4.5rem",
                88: "22rem",
            },
            animation: {
                "fade-in": "fadeIn 0.2s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "scale-in": "scaleIn 0.2s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
            },
            screens: {
                xs: "475px",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
};
