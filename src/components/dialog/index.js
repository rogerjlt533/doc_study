import {computed, createApp} from 'vue'
import tipsButton from './index.vue'
import store from "@/store/index.js"

let confirmInstance
let parentNode
const isShowDialog = computed(() => store.state.showDialog)
export default function fcDialog ({ title = '这是标题', message = '这是一条消息' }) {
    return new Promise((resolve, reject) => {
        if(isShowDialog){
            resolve()
            return
        }
        confirmInstance = createApp(tipsButton, {
            title,
            message,
            onConfirm: () => {
                resolve()
                setTimeout(() => {
                    unmount()
                },500)
            },
            onCancel: () => {
                reject()
                setTimeout(() => {
                    unmount()
                }, 500)
            }
        })

        // 创建一个挂载容器
        parentNode = document.createElement('div')
        document.body.appendChild(parentNode)

        // 挂载组件
        confirmInstance.mount(parentNode)

        // 卸载组件
        const unmount = () => {
            if(parentNode && parentNode.childNodes.length){
                confirmInstance.unmount()
                document.body.removeChild(parentNode)
            }
        }
    })
}
