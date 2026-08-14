/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-background": "#dae2fd",
        "tertiary": "#ffb2b7",
        "on-primary-fixed-variant": "#2f2ebe",
        "background": "#0b1326",
        "error-container": "#93000a",
        "outline-variant": "#464554",
        "on-surface-variant": "#c7c4d7",
        "surface-container-highest": "#2d3449",
        "secondary-fixed-dim": "#2fd9f4",
        "surface": "#0b1326",
        "on-secondary-fixed": "#001f25",
        "on-tertiary-fixed-variant": "#92002a",
        "on-secondary-fixed-variant": "#004e5a",
        "on-tertiary-fixed": "#40000d",
        "primary-fixed-dim": "#c0c1ff",
        "surface-container": "#171f33",
        "on-primary-container": "#0d0096",
        "surface-tint": "#c0c1ff",
        "secondary-container": "#00cbe6",
        "surface-container-high": "#222a3d",
        "surface-dim": "#0b1326",
        "tertiary-fixed": "#ffdadb",
        "primary-container": "#8083ff",
        "on-error": "#690005",
        "on-tertiary": "#67001b",
        "tertiary-container": "#ff516a",
        "outline": "#908fa0",
        "primary-fixed": "#e1e0ff",
        "secondary-fixed": "#a2eeff",
        "secondary": "#5de6ff",
        "on-error-container": "#ffdad6",
        "inverse-surface": "#dae2fd",
        "error": "#ffb4ab",
        "on-secondary": "#00363e",
        "inverse-primary": "#494bd6",
        "surface-container-low": "#131b2e",
        "inverse-on-surface": "#283044",
        "on-primary": "#1000a9",
        "on-secondary-container": "#00515d",
        "on-primary-fixed": "#07006c",
        "surface-bright": "#31394d",
        "surface-container-lowest": "#060e20",
        "surface-variant": "#2d3449",
        "on-tertiary-container": "#5b0017",
        "tertiary-fixed-dim": "#ffb2b7",
        "primary": "#c0c1ff",
        "on-surface": "#dae2fd"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "stack-lg": "32px",
        "container-max": "1280px"
      },
      fontFamily: {
        "headline-sm": ["Sora"],
        "display-lg": ["Sora"],
        "body-lg": ["Inter"],
        "label-sm": ["Inter"],
        "headline-md": ["Sora"],
        "label-md": ["Inter"],
        "body-md": ["Inter"],
        "display-lg-mobile": ["Sora"]
      },
      fontSize: {
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-lg-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -60px) scale(1.15)" }
        },
        driftReverse: {
          "0%, 100%": { transform: "translate(0, 0) scale(1.15)" },
          "50%": { transform: "translate(-50px, 40px) scale(0.95)" }
        }
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "drift": "drift 12s ease-in-out infinite",
        "drift-reverse": "driftReverse 15s ease-in-out infinite"
      }
    }
  },
  plugins: [daisyui],
}

