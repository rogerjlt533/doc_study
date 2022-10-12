import request from '@/utils/request-desktop'
const actionSync = require('service/action/sync')

// 拉取collection同步的队列
export function pullRemoteCollectionQueueApi(data){
    return request({
        url: 'actionSync.pullRemoteCollectionQueue',
        action: actionSync.pullRemoteCollectionQueue,
        data
    })
}

// 拉取collection下notes同步的队列
export function pullRemoteNoteQueueApi(data){
    return request({
        url: 'actionSync.pullRemoteNoteQueue',
        action: actionSync.pullRemoteNoteQueue,
        data
    })
}

// 处理下行note队列
export function processDownNoteApi(data){
    return request({
        url: 'actionSync.processDownNote',
        action: actionSync.processDownNote,
        data
    })
}

// 处理下行图片
export function processDownImageApi(data){
    return request({
        url: 'actionSync.processDownImage',
        action: actionSync.processDownImage,
        data
    })
}

// 初始化上行collection队列
export function initLocalCollectionPushQueueApi(data){
    return request({
        url: 'actionSync.initLocalCollectionPushQueue',
        action: actionSync.initLocalCollectionPushQueue,
        data
    })
}

// 初始化collection note 上行队列
export function initCollectionNotePushQueueApi(data){
    return request({
        url: 'actionSync.initCollectionNotePushQueue',
        action: actionSync.initCollectionNotePushQueue,
        data
    })
}

// 处理上行note队列
export function processNotePushQueueApi(data){
    return request({
        url: 'actionSync.processNotePushQueue',
        action: actionSync.processNotePushQueue,
        data
    })
}

// 清空已完成同步记录
export function clearCompleteCollectionQueueApi(data){
    return request({
        url: 'actionSync.clearCompleteCollectionQueue',
        action: actionSync.clearCompleteCollectionQueue,
        data
    })
}

// 自动清理已完成同步队列
// 无队列自动触发下行队列
export function autoClearCollectionQueueApi(data){
    return request({
        url: 'actionSync.autoClearCollectionQueue',
        action: actionSync.autoClearCollectionQueue,
        data
    })
}




