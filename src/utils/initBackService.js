import { handleLoopCall } from "@/utils/tools"
import { pullRemoteNoteQueueApi, processDownNoteApi, processDownImageApi, initCollectionNotePushQueueApi, processNotePushQueueApi, clearCompleteCollectionQueueApi, autoClearCollectionQueueApi, pullTagTopApi, pushTagTopApi, uploadLogApi, refreshProInfoApi, fillTagInitialApi, fillNoteContentApi, processUrgentDownNoteApi, pullUrgentRemoteNoteQueueApi } from '@/apiDesktop/sync'

const migration = require('service/tool/migration.js')
const version = process.env.VUE_APP_VERSION
let pub_key = ''
let user_hash = ''
let token = ''

// 初始化数据库
export const initMigration = async (params) => {
    console.log('执行migration')
    await migration.run()
    console.log('初始化数据库完成')
    await fillTagInitialApi()
    await fillNoteContentApi()
    await handleClearCompleteCollectionQueue()
    console.log('清理上传数据完成')

    console.log('获取参数', params)
    pub_key = params.pub_key
    user_hash = params.user_hash
    token = params.token
    initSync()
}

export const initSync = () => {
    handleClearCompleteCollectionQueue()
    setTimeout(() => {
        handlePullRemoteNoteQueue()
        handleProcessDownNote()

        initBasicsData()
    }, 2 * 1000)

    setInterval(() => {
        handleInitCollectionNotePushQueue()
        handleClearCompleteCollectionQueue()
    }, 15 * 60 * 1000)

    setInterval(() => {
        handleProcessNotePushQueue()
    }, 20 * 1000)

    setInterval(() => {
        handlePullRemoteNoteQueue()
        handleProcessDownNote()

    }, 30 * 1000)

    setInterval(() => {
        handleUploadLog()
    }, 60 * 1000)

    setInterval(() => {
        handleAutoClearCollectionQueue()
        handlePullTagTop()
        handleProcessUrgentDownNote()
        handlePullUrgentRemoteNoteQueue()
    }, 5 * 60 * 1000)

    setInterval(() => {
        handleRefreshProInfo()
        handleProcessDownImage()
        handlePushTagTop()
    }, 3 * 60 * 1000)
}

function initBasicsData(){
    handleLoopCall({
        func: () => {
            handlePullRemoteNoteQueue()
            handleProcessDownNote()
        },
        startCount: 0,
        endCount: 8,
        time: 5
    })
}

function handlePullRemoteNoteQueue(){
    const data = {
        token
    }
    pullRemoteNoteQueueApi(data)
}
function handleProcessDownNote(){
    const data = {
        token,
        pub_key
    }
    processDownNoteApi(data)
}
function handleProcessDownImage(){
    const data = {
        token,
        pub_key
    }
    processDownImageApi(data)
}
function handleInitCollectionNotePushQueue(){
    const data = {
        token,
        pub_key
    }
    initCollectionNotePushQueueApi(data)
}
function handleProcessNotePushQueue(){
    const data = {
        token,
        pub_key,
        platform: "desktop",
        version: version
    }
    processNotePushQueueApi(data)
}

function handleClearCompleteCollectionQueue(){
    const data = {
        token
    }
    clearCompleteCollectionQueueApi(data)
}

function handleAutoClearCollectionQueue(){
    const data = {
        token
    }
    autoClearCollectionQueueApi(data)
}

function handleRefreshProInfo(){
    const data = {
        token
    }
    refreshProInfoApi(data)
}

function handlePullTagTop(){
    const data = {
        token
    }
    pullTagTopApi(data)
}

function handlePushTagTop(){
    const data = {
        token
    }
    pushTagTopApi(data)
}

function handleUploadLog(){
    const data = {
        token,
        version: version
    }
    uploadLogApi(data)
}

function handleProcessUrgentDownNote(){
    const data = {
        token,
        pub_key
    }
    processUrgentDownNoteApi(data)
}

function handlePullUrgentRemoteNoteQueue(){
    const data = {
        token
    }
    pullUrgentRemoteNoteQueueApi(data)
}

