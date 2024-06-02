
import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const customTheme: CustomThemeConfig = {
    name: 'custom-theme',
    properties: {
		// =~= Theme Properties =~=
		"--theme-font-family-base": `system-ui`,
		"--theme-font-family-heading": `system-ui`,
		"--theme-font-color-base": "0 0 0",
		"--theme-font-color-dark": "255 255 255",
		"--theme-rounded-base": "2px",
		"--theme-rounded-container": "2px",
		"--theme-border-base": "0px",
		// =~= Theme On-X Colors =~=
		"--on-primary": "255 255 255",
		"--on-secondary": "255 255 255",
		"--on-tertiary": "0 0 0",
		"--on-success": "0 0 0",
		"--on-warning": "0 0 0",
		"--on-error": "255 255 255",
		"--on-surface": "255 255 255",
		// =~= Theme Colors  =~=
		// primary | #1a76c6 
		"--color-primary-50": "221 234 246", // #ddeaf6
		"--color-primary-100": "209 228 244", // #d1e4f4
		"--color-primary-200": "198 221 241", // #c6ddf1
		"--color-primary-300": "163 200 232", // #a3c8e8
		"--color-primary-400": "95 159 215", // #5f9fd7
		"--color-primary-500": "26 118 198", // #1a76c6
		"--color-primary-600": "23 106 178", // #176ab2
		"--color-primary-700": "20 89 149", // #145995
		"--color-primary-800": "16 71 119", // #104777
		"--color-primary-900": "13 58 97", // #0d3a61
		// secondary | #392F5A 
		"--color-secondary-50": "225 224 230", // #e1e0e6
		"--color-secondary-100": "215 213 222", // #d7d5de
		"--color-secondary-200": "206 203 214", // #cecbd6
		"--color-secondary-300": "176 172 189", // #b0acbd
		"--color-secondary-400": "116 109 140", // #746d8c
		"--color-secondary-500": "57 47 90", // #392F5A
		"--color-secondary-600": "51 42 81", // #332a51
		"--color-secondary-700": "43 35 68", // #2b2344
		"--color-secondary-800": "34 28 54", // #221c36
		"--color-secondary-900": "28 23 44", // #1c172c
		// tertiary | #CAE5FF 
		"--color-tertiary-50": "247 251 255", // #f7fbff
		"--color-tertiary-100": "244 250 255", // #f4faff
		"--color-tertiary-200": "242 249 255", // #f2f9ff
		"--color-tertiary-300": "234 245 255", // #eaf5ff
		"--color-tertiary-400": "218 237 255", // #daedff
		"--color-tertiary-500": "202 229 255", // #CAE5FF
		"--color-tertiary-600": "182 206 230", // #b6cee6
		"--color-tertiary-700": "152 172 191", // #98acbf
		"--color-tertiary-800": "121 137 153", // #798999
		"--color-tertiary-900": "99 112 125", // #63707d
		// success | #84cc16 
		"--color-success-50": "237 247 220", // #edf7dc
		"--color-success-100": "230 245 208", // #e6f5d0
		"--color-success-200": "224 242 197", // #e0f2c5
		"--color-success-300": "206 235 162", // #ceeba2
		"--color-success-400": "169 219 92", // #a9db5c
		"--color-success-500": "132 204 22", // #84cc16
		"--color-success-600": "119 184 20", // #77b814
		"--color-success-700": "99 153 17", // #639911
		"--color-success-800": "79 122 13", // #4f7a0d
		"--color-success-900": "65 100 11", // #41640b
		// warning | #EAB308 
		"--color-warning-50": "252 244 218", // #fcf4da
		"--color-warning-100": "251 240 206", // #fbf0ce
		"--color-warning-200": "250 236 193", // #faecc1
		"--color-warning-300": "247 225 156", // #f7e19c
		"--color-warning-400": "240 202 82", // #f0ca52
		"--color-warning-500": "234 179 8", // #EAB308
		"--color-warning-600": "211 161 7", // #d3a107
		"--color-warning-700": "176 134 6", // #b08606
		"--color-warning-800": "140 107 5", // #8c6b05
		"--color-warning-900": "115 88 4", // #735804
		// error | #AF1B3F 
		"--color-error-50": "243 221 226", // #f3dde2
		"--color-error-100": "239 209 217", // #efd1d9
		"--color-error-200": "235 198 207", // #ebc6cf
		"--color-error-300": "223 164 178", // #dfa4b2
		"--color-error-400": "199 95 121", // #c75f79
		"--color-error-500": "175 27 63", // #AF1B3F
		"--color-error-600": "158 24 57", // #9e1839
		"--color-error-700": "131 20 47", // #83142f
		"--color-error-800": "105 16 38", // #691026
		"--color-error-900": "86 13 31", // #560d1f
		// surface | #495a8f 
		"--color-surface-50": "228 230 238", // #e4e6ee
		"--color-surface-100": "219 222 233", // #dbdee9
		"--color-surface-200": "210 214 227", // #d2d6e3
		"--color-surface-300": "182 189 210", // #b6bdd2
		"--color-surface-400": "128 140 177", // #808cb1
		"--color-surface-500": "73 90 143", // #495a8f
		"--color-surface-600": "66 81 129", // #425181
		"--color-surface-700": "55 68 107", // #37446b
		"--color-surface-800": "44 54 86", // #2c3656
		"--color-surface-900": "36 44 70", // #242c46
		
	}
}