/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'
import {createPinia} from "pinia";

const app = createApp(App)
const pinia = createPinia()

app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 10,
  newestOnTop: true,
  position: "bottom-right",
  timeout: 3000,
  closeOnClick: false,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: false,
  draggablePercent: 0.6,
  showCloseButtonOnHover: true,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
});

registerPlugins(app)
app.use(pinia)

app.mount('#app')
