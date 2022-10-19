import { ref, reactive } from 'vue'
import { ipcRenderer } from "electron"
import { ElMessageBox, ElNotification } from "element-plus";

export let showUpdater = ref(false)
export let downloadProcess = ref({})

export function handleUpdate(){
    // 发现新版本
    ipcRenderer.once('autoUpdater-canUpdate', (event, info) => {
        console.log('info', event, info)
        ElMessageBox.confirm(`发现有新版本【v${info.version}】，是否更新？`, {
            type: 'warning',
            confirmButtonText: '现在更新',
            cancelButtonText: '下次一定'
        }).then(async ()=>{
            ipcRenderer.send('autoUpdater-toDownload')
        }).catch(()=>{})
    })
    // 下载进度
    ipcRenderer.on('autoUpdater-progress', (event, process) => {
        if (process.transferred >= 1024 * 1024) {
            process.transferred = (process.transferred / 1024 / 1024).toFixed(2) + 'M'
        } else {
            process.transferred = (process.transferred / 1024).toFixed(2) + 'K'
        }
        if (process.total >= 1024 * 1024) {
            process.total = (process.total / 1024 / 1024).toFixed(2) + 'M'
        } else {
            process.total = (process.total / 1024).toFixed(2) + 'K'
        }
        if (process.bytesPerSecond >= 1024 * 1024) {
            process.speed = (process.bytesPerSecond / 1024 / 1024).toFixed(2) + 'M/s'
        } else if (process.bytesPerSecond >= 1024) {
            process.speed = (process.bytesPerSecond / 1024).toFixed(2) + 'K/s'
        } else {
            process.speed = process.bytesPerSecond + 'B/s'
        }
        process.percent = process.percent.toFixed(2)
        downloadProcess.value = process
        showUpdater.value = true
    })
    // 下载更新失败
    ipcRenderer.once('autoUpdater-error', (event, err) => {
        console.log('err', err)
        ElNotification.error('更新失败，请重试！')
        showUpdater.value = false
    })
    // 下载完成
    ipcRenderer.once('autoUpdater-downloaded', () => {
        ElMessageBox.confirm(`更新完成，是否关闭应用程序安装新版本?`, {
            type: 'success',
            confirmButtonText: '马上重启',
            showCancelButton: false
        }).then(async ()=>{
            ipcRenderer.send('exit-app')
        }).catch(()=>{})
    })
}
