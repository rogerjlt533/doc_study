import request from '@/utils/syncRequest'
const actionSync = require('service/action/sync')
const actionTag = require('service/action/tag')
const actionUser = require('service/action/user')

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

// 下行置顶标签
export function pullTagTopApi(data){
    return request({
        url: 'actionSync.pullTagTop',
        action: actionSync.pullTagTop,
        data
    })
}

// 上行置顶标签
export function pushTagTopApi(data){
    return request({
        url: 'actionSync.pushTagTop',
        action: actionSync.pushTagTop,
        data
    })
}

//
export function uploadLogApi(data){
    return request({
        url: 'actionSync.uploadLog',
        action: actionSync.uploadLog,
        data
    })
}

// 更新标签声母，填充空声母
export function fillTagInitialApi(data){
    return request({
        url: 'actionTag.fillTagInitial',
        action: actionTag.fillTagInitial,
        data
    })
}

// 刷新pro权限
export function refreshProInfoApi(data){
    return request({
        url: 'actionUser.refreshProInfo',
        action: actionUser.refreshProInfo,
        data
    })
}

// 填充笔记无标签内容
export function fillNoteContentApi(data){
    return request({
        url: 'actionSync.fillNoteContent',
        action: actionSync.fillNoteContent,
        data
    })
}

// 下拉远程note权重
export function pullRemoteNoteWeightApi(data){
    return request({
        url: 'actionSync.pullRemoteNoteWeight',
        action: actionSync.pullRemoteNoteWeight,
        data
    })
}

// 定时处理note队列
export function processUrgentDownNoteApi(data){
    return request({
        url: 'actionSync.processUrgentDownNote',
        action: actionSync.processUrgentDownNote,
        data
    })
}

// 拉取紧急collection下notes同步的队列
export function pullUrgentRemoteNoteQueueApi(data){
    return request({
        url: 'actionSync.pullUrgentRemoteNoteQueue',
        action: actionSync.pullUrgentRemoteNoteQueue,
        data
    })
}

// 处理紧急上行note队列
export function processUrgentNotePushQueueApi(data){
    return request({
        url: 'actionSync.processUrgentNotePushQueue',
        action: actionSync.processUrgentNotePushQueue,
        data
    })
}


