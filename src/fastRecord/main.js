import { createApp } from 'vue'
import App from './App.vue'
import store from '../store'
import { initMigration } from "@/assets/js/initBackService"

const app = createApp(App);

(function (){
    initMigration().then()
})()

app.use(store).mount('#app')