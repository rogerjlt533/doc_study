import { getToken } from "@/utils/auth"
import { handleLoopCall } from "@/utils/tools"
import store from "@/store/index.js"
import { computed, watch } from "vue"
import { pullRemoteNoteQueueApi, processDownNoteApi, processDownImageApi, initCollectionNotePushQueueApi, processNotePushQueueApi, clearCompleteCollectionQueueApi, autoClearCollectionQueueApi } from '@/apiDesktop/sync'
import { refreshProInfoApi } from '@/apiDesktop/user'

const migration = require('service/tool/migration.js')

// 初始化数据库
export const initMigration = async () => {
    console.log('执行migration')
    await migration.run()
    console.log('初始化数据库完成')
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

        store.dispatch('collection/getCollection', { page: 1, size: 100 })
        store.dispatch('user/getUserBase')
        store.dispatch("notes/getTagsList")
        store.dispatch('notes/getTagsGroup')
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
            store.dispatch('collection/getCollection', { page: 1, size: 100 })
            store.dispatch('user/getUserBase')
            store.dispatch("notes/getTagsList")
            store.dispatch('notes/getTagsGroup')
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

