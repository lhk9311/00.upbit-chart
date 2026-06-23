import { createApp } from 'vue'
import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import App from './App.vue'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)

app.use(VueApexCharts)

app.mount('#app')