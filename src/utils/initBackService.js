import { getToken } from "@/utils/auth"
import { handleLoopCall } from "@/utils/tools"
import store from "@/store"
import { computed, watch } from "vue"
import { pullRemoteNoteQueueApi, processDownNoteApi, processDownImageApi, initCollectionNotePushQueueApi, processNotePushQueueApi, clearCompleteCollectionQueueApi, autoClearCollectionQueueApi } from '@/apiDesktop/sync'
import { refreshProInfoApi } from '@/apiDesktop/user'
import { fillTagInitialApi } from "@/apiDesktop/tag"

// const Store = require('electron-store')
// const electronStore = new Store()
// const vuex = electronStore.get('vuex')

const migration = require('service/tool/migration.js')

// 初始化数据库
export const initMigration = async () => {
    console.log('执行migration')
    await migration.run()
    console.log('初始化数据库完成')
    await fillTagInitialApi()
    await handleClearCompleteCollectionQueue()
    console.log('清理上传数据完成')

    initSync()
}
// 执行清理已完成的同步记录

// 执行上行下行
const pub_key = computed(() => store.state.user.userInfo.pk)
const user_hash = computed(() => store.state.user.userInfo.user_hash)
watch(() => user_hash.value, () => {
    initSync()
})
export const initSync = () => {
    console.log('getToken', getToken())
    console.log('user_hash', user_hash.value)
    if(!getToken() || !user_hash.value) return false

    setTimeout(() => {
        handlePullRemoteNoteQueue()
        handleProcessDownNote()

        initBasicsData()
    }, 2 * 1000)

    setInterval(() => {
        handleInitCollectionNotePushQueue()
    }, 15 * 60 * 1000)

    setInterval(() => {
        handleProcessNotePushQueue()
    }, 20 * 1000)

    setInterval(() => {
        handlePullRemoteNoteQueue()
        handleProcessDownNote()

        store.dispatch('collection/getCollection')
        store.dispatch('user/getUserBase')
        store.dispatch("notes/getTagsList")
        store.dispatch('notes/getGroupInitial')
    }, 30 * 1000)

    setInterval(() => {
        if(!getToken() || !user_hash.value) return false
        handleAutoClearCollectionQueue()
    }, 5 * 60 * 1000)

    setInterval(() => {
        if(!getToken() || !user_hash.value) return false
        handleRefreshProInfo()
        handleProcessDownImage()
    }, 3 * 60 * 1000)
}

function initBasicsData(){
    handleLoopCall({
        func: () => {
            handlePullRemoteNoteQueue()
            handleProcessDownNote()
            store.dispatch('collection/getCollection')
            store.dispatch('user/getUserBase')
            store.dispatch("notes/getTagsList")
            store.dispatch('notes/getGroupInitial')
        },
        startCount: 0,
        endCount: 8,
        time: 5
    })
}


function handlePullRemoteNoteQueue(){
    const data = {
        token: getToken()
    }
    pullRemoteNoteQueueApi(data)
}
function handleProcessDownNote(){
    const data = {
        token: getToken(),
        pub_key: pub_key.value
    }
    processDownNoteApi(data)
}
function handleProcessDownImage(){
    const data = {
        token: getToken(),
        pub_key: pub_key.value
    }
    processDownImageApi(data)
}
function handleInitCollectionNotePushQueue(){
    const data = {
        token: getToken(),
        pub_key: pub_key.value
    }
    initCollectionNotePushQueueApi(data)
}
function handleProcessNotePushQueue(){
    const data = {
        token: getToken(),
        pub_key: pub_key.value
    }
    processNotePushQueueApi(data)
}

function handleClearCompleteCollectionQueue(){
    const data = {
        token: getToken()
    }
    clearCompleteCollectionQueueApi(data)
}

function handleAutoClearCollectionQueue(){
    const data = {
        token: getToken()
    }
    autoClearCollectionQueueApi(data)
}

function handleRefreshProInfo(){
    const data = {
        token: getToken()
    }
    refreshProInfoApi(data)
}

