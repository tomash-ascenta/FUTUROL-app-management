/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Futurol brand colors - professional light theme
				primary: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',  // Main green
					600: '#16a34a',  // CTA button
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16'
				},
				// Light theme - professional manufacturing look
				futurol: {
					// Backgrounds
					white: '#ffffff',
					bg: '#f8fafc',        // Main background (slate-50)
					surface: '#ffffff',    // Card/surface background
					sidebar: '#1e293b',    // Dark sidebar (slate-800)
					
					// Text
					text: '#0f172a',       // Primary text (slate-900)
					muted: '#64748b',      // Secondary text (slate-500)
					
					// Borders
					border: '#e2e8f0',     // Default border (slate-200)
					divider: '#cbd5e1',    // Stronger divider (slate-300)
					
					// Brand accents
					green: '#16a34a',      // Brand green
					greenLight: '#dcfce7', // Light green background
					greenDark: '#14532d',  // Dark green text
					
					// Main brand color - wine/magenta
					wine: '#a50046',       // Primary brand color
					wineLight: '#fdf2f8',  // Light wine background
					wineDark: '#831843',   // Dark wine
					
					// Status colors
					success: '#22c55e',
					warning: '#f59e0b',
					error: '#ef4444',
					info: '#3b82f6'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			boxShadow: {
				'soft': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
				'sidebar': '4px 0 6px -1px rgb(0 0 0 / 0.1)'
			}
		}
	},
	plugins: []
};
