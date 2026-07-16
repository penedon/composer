import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App/App.vue'
import { router } from './presentation/router/router'
import './presentation/styles/tokens.scss'

createApp(App).use(createPinia()).use(router).mount('#app')
