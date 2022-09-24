import { getToken } from "@/utils/auth"
import store from "@/store/index.js"
import { computed } from "vue"
import { pullRemoteCollectionQueueApi, pullRemoteNoteQueueApi, processDownNoteApi, processDownImageApi, initLocalCollectionPushQueueApi, initCollectionNotePushQueueApi, processNotePushQueueApi, clearCompleteCollectionQueueApi, autoClearCollectionQueueApi } from '@/apiDesktop/sync'


const workpool = require('workerpool')
const path = require('path')

console.log('__dirname',path.join(__dirname, '/backWork.js'))
const pool = workpool.pool(path.join(__dirname, '/backWork.js'), {workerType: "process"})
pool.exec((a, b) => a + b, [ 1, 2 ]).then((res) => {
    console.log('Result: ' + res)
})

// const add = (a, b) => a + b;
//
// pool.exec(add, [1, 2])
//     .then(function (result) {
//         console.log('Result: ' + result); // outputs 55
//     })
//     .catch(function (err) {
//         console.error(err);
//     })
//     .then(function () {
//         pool.terminate(); // terminate all workers when done
//     })
// pool.exec((e) => {
//     console.log("222", e)
// }, [2])
//     .then(function (result) {
//         console.log('Result: ' + result); // outputs 55
//     })
//     .catch(function (err) {
//         console.error(err);
//     })
//     .then(function () {
//         pool.terminate(); // terminate all workers when done
//     })
// pool.exec((e) => {
//     console.log("eee", e)
// }, [3])
//     .then(function (result) {
//         console.log('Result: ' + result); // outputs 55
//     })
//     .catch(function (err) {
//         console.error(err);
//     })
//     .then(function () {
//         pool.terminate(); // terminate all workers when done
//     })


function test(a){
    console.log(a)
}


const migration = require('service/tool/migration.js')

// import Workers from "./backService.worker";
// const worker = new Workers()

const pub_key = computed(() => store.state.user.userInfo.pk)
const user_hash = computed(() => store.state.user.userInfo.user_hash)
const token = getToken()

// 初始化数据库
export const initMigration = async () => {
    console.log('执行migration')
    await migration.run()
    console.log('初始化数据库完成')
    await handleClearCompleteCollectionQueue()
    console.log('清理上传数据完成')

    // if(!getToken() || !user_hash.value) return false
    // worker.postMessage({
    //     token: token,
    //     pub_key: pub_key.value,
    //     user_hash: user_hash.value
    // })
}
// 执行清理已完成的同步记录

// 执行上行下行

export const initSync = () => {

    setInterval(() => {
        if(!getToken() || !user_hash.value) return false
        handleAutoClearCollectionQueue()

        handlePullRemoteNoteQueue()
        handleProcessDownNote()
        handleInitCollectionNotePushQueue()
        handleProcessNotePushQueue()

        store.dispatch('collection/getCollection', { page: 1, size: 100 })
        store.dispatch('user/getUserBase')
    }, 60 * 1000)

    setInterval(() => {
        if(!getToken() || !user_hash.value) return false
        handleProcessDownImage()

    }, 10 * 60 * 1000)
}

function handlePullRemoteCollectionQueue(){
    const data = {
        token: getToken()
    }
    pullRemoteCollectionQueueApi(data)
}
function handlePullRemoteNoteQueue(token){
    const data = {
        token
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
function handleInitLocalCollectionPushQueue(){
    const data = {
        token: getToken()
    }
    initLocalCollectionPushQueueApi(data)
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
