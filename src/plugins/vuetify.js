/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import {createVuetify} from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#131C43',
          secondary: '#FFFFFF',
          accent: '#D84315',
          success: '#09933f',
          info: '#1677bd',
        }
      },
      light: {
        colors: {
          primary: '#131C43',
          secondary: '#FFFFFF',
          accent: '#D84315',
          success: '#09933f',
          info: '#1677bd',
          background: '#f5f5f5',
        }
      }
    },
  },
})
