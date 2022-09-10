const workerpool = require('workerpool')
const sync = require('./sync')

function initPullRemoteNote(token) {
    sync.pullRemoteNoteQueue(token)
}

function processPullRemoteNote(token, pub_key) {
    sync.processNotePushQueue(token, pub_key)
}

function pullRemoteImage(token, pub_key, path = '') {
    sync.processDownImage(token, pub_key, path)
}

function initPushRemoteNote(token, pub_key) {
    sync.initCollectionNotePushQueue(token, pub_key)
}

function processPushRemoteNote(token, pub_key) {
    sync.processNotePushQueue(token, pub_key)
}

function test(value) {
    console.log(value)
}

workerpool.worker({test})



// import { getToken } from "@/utils/auth"
// import store from "@/store/index.js"
// import { computed } from "vue"
// import { pullRemoteCollectionQueueApi, pullRemoteNoteQueueApi, processDownNoteApi, processDownImageApi, initLocalCollectionPushQueueApi, initCollectionNotePushQueueApi, processNotePushQueueApi, clearCompleteCollectionQueueApi, autoClearCollectionQueueApi } from '@/apiDesktop/sync'
//
// const pub_key = computed(() => store.state.user.userInfo.pk)
// const user_hash = computed(() => store.state.user.userInfo.user_hash)

// 执行上行下行
// const initSync = () => {
//     setInterval(() => {
//         if(!getToken() || !user_hash.value) return false
//         handleAutoClearCollectionQueue()
//
//         handlePullRemoteNoteQueue()
//         handleProcessDownNote()
//         handleInitCollectionNotePushQueue()
//         handleProcessNotePushQueue()
//
//         store.dispatch('collection/getCollection', { page: 1, size: 100 })
//         store.dispatch('user/getUserBase')
//     }, 60 * 1000)
//
//     setInterval(() => {
//         if(!getToken() || !user_hash.value) return false
//         handleProcessDownImage()
//
//     }, 10 * 60 * 1000)
// }

// function xxx(){
//     console.log("xxxxxxxxx")
// }
//
// function handlePullRemoteCollectionQueue(){
//     const data = {
//         token: getToken()
//     }
//     pullRemoteCollectionQueueApi(data)
// }
// function handlePullRemoteNoteQueue(){
//     const data = {
//         token: getToken()
//     }
//     pullRemoteNoteQueueApi(data)
// }
// function handleProcessDownNote(){
//     const data = {
//         token: getToken(),
//         pub_key: pub_key.value
//     }
//     processDownNoteApi(data)
// }
// function handleProcessDownImage(){
//     const data = {
//         token: getToken(),
//         pub_key: pub_key.value
//     }
//     processDownImageApi(data)
// }
// function handleInitLocalCollectionPushQueue(){
//     const data = {
//         token: getToken()
//     }
//     initLocalCollectionPushQueueApi(data)
// }
// function handleInitCollectionNotePushQueue(){
//     const data = {
//         token: getToken(),
//         pub_key: pub_key.value
//     }
//     initCollectionNotePushQueueApi(data)
// }
// function handleProcessNotePushQueue(){
//     const data = {
//         token: getToken(),
//         pub_key: pub_key.value
//     }
//     processNotePushQueueApi(data)
// }
//
// function handleClearCompleteCollectionQueue(){
//     const data = {
//         token: getToken()
//     }
//     clearCompleteCollectionQueueApi(data)
// }
//
// function handleAutoClearCollectionQueue(){
//     const data = {
//         token: getToken()
//     }
//     autoClearCollectionQueueApi(data)
// }
