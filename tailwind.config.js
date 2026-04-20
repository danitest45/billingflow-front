export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#eff6ff",
                    100: "#dbeafe",
                    200: "#bfdbfe",
                    300: "#93c5fd",
                    400: "#60a5fa",
                    500: "#2563eb",
                    600: "#1d4ed8",
                    700: "#1e40af",
                    800: "#1e3a8a",
                    900: "#172554"
                },
                surface: "#f8fafc",
                ink: "#0f172a"
            },
            boxShadow: {
                soft: "0 24px 48px -24px rgba(15, 23, 42, 0.32)"
            },
            backgroundImage: {
                "hero-grid": "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 30%), radial-gradient(circle at top right, rgba(16, 185, 129, 0.14), transparent 26%), linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88))"
            }
        }
    },
    plugins: []
};
