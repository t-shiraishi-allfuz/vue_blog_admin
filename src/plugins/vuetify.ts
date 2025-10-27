import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {ja} from 'vuetify/locale'

export default createVuetify({
	locale: {
		messages: { ja },
	},
	components,
	directives,
	theme: {
		themes: {
			light: {
				colors: {
					primary: '#F784C3',
					secondary: '#27C1A3',
					info: '#27C1A3',
					'on-info': '#FFFFFF',
					success: '#27C1A3',
					'on-success': '#FFFFFF',
					green: '#27C1A3',
					'on-green': '#FFFFFF',
					'pink-lighten-2': '#F784C3',
					'on-pink-lighten-2': '#FFFFFF',
				},
			},
		},
	},
})
