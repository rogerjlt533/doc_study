import { createApp } from 'vue'
import App from './App.vue'
import store from '../store'
import { ipcRenderer } from "electron"
import { initMigration, initSync } from "@/utils/initBackService"

const app = createApp(App);
// const eStore = require('electron-store');
// const electronStore = new eStore();

ipcRenderer.on('startSync', async (event, params) => {
    console.log("startSync", params)
    await initMigration(params)
    // initSync()
})

//
// (function (){
//
// })()

// 监听主进程发送的消息
// ipcRenderer.on('listenSync', () => {
//     console.log('开始同步信息')
//     handleReloadVuex()
//     setTimeout(() => {
//         initSync()
//     }, 3000)
// })

// function handleReloadVuex(){
//     const vuex = JSON.parse(electronStore.get('vuex'))
//     store.commit('RESET_VUEX_STATE', vuex)
// }

app.use(store).mount('#app')