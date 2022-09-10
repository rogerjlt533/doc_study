const common = require('../tool/common');
const syncService = require('../service/sync');
const fingerService = require('../service/finger');
const collectionService = require('../service/collection')
const httpTool = require('../tool/http');
const opLogTool = require('../tool/oplogtool');

/**
 * 拉取collection同步的队列
 * @param token 用户登录获取的token
 * @returns {Promise<{status_code: number, message: string}>}
 */
const pullRemoteCollectionQueue = async function (token) {
    // await syncService.pullRemoteCollection(token)
    return {status_code: 200, message: 'success'}
}

/**
 * 拉取collection下notes同步的队列
 * @param token
 * @returns {Promise<{status_code: number, message: string}>}
 */
exports.pullRemoteNoteQueue = async function (token) {
    // await syncService.pullRemoteNotes(token)
    return {status_code: 200, message: 'success'}
}

/**
 * 拉取紧急collection下notes同步的队列
 * @param token
 * @returns {Promise<{status_code: number, message: string}>}
 */
exports.pullUrgentRemoteNoteQueue = async function (token) {
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    await syncService.pullUrgentCollection(token)
    return {status_code: 200, message: 'success'}
}

/**
 * 处理下行note队列
 * @param token
 * @param pub_key
 * @returns {Promise<{status_code: number, message: string}>}
 */
exports.processDownNote = async function (token, pub_key) {
    const user_id = common.decodeDesktop(token)
    const urgent_download = await syncService.syncTool.downUrgentNotes(user_id)
    if (urgent_download.length > 0) {
        return {status_code: 400, message: '存在紧急下行'}
    }
    const urgent_upload = await syncService.syncTool.pushUrgentNotes(user_id)
    if (urgent_upload.length > 0) {
        return {status_code: 400, message: '存在紧急上行'}
    }
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    const {status, data} = await syncService.getDownNotes(token, pub_key, 100)
    if (status) {
        const collections = []
        for (const note of data) {
            const collection_id = common.decode(note.collection.id)
            if (collections.indexOf(collection_id) === -1) {
                collections.push(collection_id)
            }
            const remote_id = common.decode(note.note.id)
            const record = await syncService.noteService.noteTool.remote(remote_id)
            if (!common.empty(record) && !common.empty(record.id)) {
                const push_sync = await syncService.syncTool.pushRemoteNote(user_id, record.id)
                if (!common.empty(push_sync)) {
                    continue
                }
            }
            await syncService.processDownNote(token, pub_key, note)
        }
        // for (const collection_id of collections) {
        //     await syncService.syncPullCollectionRemoteNoteCount(token, collection_id)
        // }
        await syncService.removeDownRemoteCollection(common.decodeDesktop(token))
        const pull_collection_list = await syncService.syncTool.downCollections(common.decodeDesktop(token))
        if (pull_collection_list.length === 0) {
            await syncService.syncTool.deleteBatch('user_id= ' + common.decodeDesktop(token) + ' and sync_type=21 and sync_direct=1 and sync_urgent=0')
            await initLocalCollectionPushQueue(token)
        }
    }
    return {status_code: 200, message: 'success'}
}

exports.processUrgentDownNote = async function (token, pub_key) {
    const user_id = common.decodeDesktop(token)
    await syncService.syncTool.deleteBatch('user_id= ' + user_id + ' and sync_type=21 and sync_direct=1 and sync_urgent=1 and status=1')
    const urgent_upload = await syncService.syncTool.pushUrgentNotes(user_id)
    if (urgent_upload.length > 0) {
        return {status_code: 400, message: '存在紧急上行'}
    }
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    const {status, data} = await syncService.getUrgentDownNotes(token, pub_key, 100)
    if (status) {
        const collections = []
        for (const note of data) {
            const collection_id = common.decode(note.collection.id)
            if (collections.indexOf(collection_id) === -1) {
                collections.push(collection_id)
            }
            const remote_id = common.decode(note.note.id)
            const record = await syncService.noteService.noteTool.remote(remote_id)
            if (!common.empty(record) && !common.empty(record.id)) {
                const push_sync = await syncService.syncTool.pushRemoteNote(user_id, record.id)
                if (!common.empty(push_sync)) {
                    continue
                }
            }
            await syncService.processDownNote(token, pub_key, note, 1)
        }
        // for (const collection_id of collections) {
        //     await syncService.syncPullCollectionRemoteNoteCount(token, collection_id)
        // }
        await syncService.removeUrgentDownRemoteCollection(common.decodeDesktop(token))
        const pull_collection_list = await syncService.syncTool.downUrgentCollections(common.decodeDesktop(token))
        if (pull_collection_list.length === 0) {
            await syncService.syncTool.deleteBatch('user_id= ' + common.decodeDesktop(token) + ' and sync_type=21 and sync_direct=1 and sync_urgent=1')
            await initLocalCollectionPushQueue(token)
        }
    }
    return {status_code: 200, message: 'success'}
}

/**
 * 处理下行图片
 * @param token
 * @param pub_key
 * @param path 上传图片后传入
 * @returns {Promise<*>}
 */
exports.processDownImage = async function (token, pub_key, path = '') {
    const {status, data} = await syncService.getDownImage(token, pub_key, path)
    if (!status) {
        return {status_code: 400, message: '无记录'}
    }
    const user_id = common.decodeDesktop(token)
    for (const image of data) {
        if (common.empty(image.id)) {
            continue
        }
        await fingerService.storeNoteRemote(user_id, common.decode(image.id), image, image.remote_create_time)
    }
    return {status_code: 200, message: 'success'}
}

// exports.processBakNote = async function (token, pub_key) {
//     const user_id = common.decodeDesktop(token)
//     const sync_list = await syncService.syncTool.userNotes(user_id, 21, 3)
//     for (const sync of sync_list) {
//         await syncService.processBakNotes(token, pub_key, sy)
//     }
// }

/**
 * 初始化上行collection队列
 * @param token
 * @returns {Promise<*>}
 */
const initLocalCollectionPushQueue = async function (token) {
    // const user_id = common.decodeDesktop(token)
    // const collections = await syncService.syncTool.downCollections(user_id)
    // if (collections.length > 0) {
    //     return {status_code: 400, message: '正在处理下行'}
    // }
    // const sync_list = await syncService.syncTool.pushCollections(user_id)
    // if (sync_list.length > 0) {
    //     return {status_code: 400, message: '正在处理上行内容'}
    // }
    // const list = await collectionService.all(user_id, '*')
    // if (common.empty(list) || list.length === 0) {
    //     return {status_code: 400, message: ''}
    // }
    // for (const item of list) {
    //     await syncService.initCollectionPushQueue(user_id, item)
    // }
    return {status_code: 200, message: 'success'}
}

/**
 * 初始化collection note 上行队列
 * @param token
 * @param pub_key
 * @returns {Promise<*>}
 */
exports.initCollectionNotePushQueue = async function (token, pub_key) {
    // const result = await syncService.pushLocalNotes(token, pub_key)
    // if (result) {
    //     return {status_code: 200, message: 'success'}
    // }
    // return {status_code: 400, message: '操作错误'}WW
    return {status_code: 200, message: 'success'}
}

/**
 * 处理上行note队列
 * @param token
 * @param pub_key
 * @param platform
 * @param version
 * @returns {Promise<{status_code: number, message: string}>}
 */
exports.processNotePushQueue = async function (token, pub_key, platform = '', version = '') {
    const user_id = common.decodeDesktop(token)
    const urgent_download = await syncService.syncTool.downUrgentNotes(user_id)
    if (urgent_download.length > 0) {
        return {status_code: 400, message: '存在紧急下行'}
    }
    const urgent_upload = await syncService.syncTool.pushUrgentNotes(user_id)
    if (urgent_upload.length > 0) {
        return {status_code: 400, message: '存在紧急上行'}
    }
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    await syncService.syncTool.deleteBatch('user_id= ' + user_id + ' and sync_type=21 and sync_direct=2 and sync_urgent=0 and status=1')
    const {status, data} = await syncService.getPushNotes(token, pub_key, platform, version, 60)
    // if (status) {
    //     // const collections = []
    //     for (const note of data) {
    //         const collection_id = note.collection_id
    //         if (collections.indexOf(collection_id) === -1) {
    //             collections.push(collection_id)
    //         }
    //     }
    // }
    // await syncService.removePushLocalCollection(common.decodeDesktop(token))
    // const push_note_count = await syncService.syncTool.userNoteCount(common.decodeDesktop(token), 21, 2)
    // const push_collection_list = await syncService.syncTool.pushCollections(common.decodeDesktop(token))
    // if (push_note_count === 0) {
    //     const urgent_download = await syncService.syncTool.downUrgentNotes(user_id)
    //     if (urgent_download.length === 0) {
    //         await pullRemoteCollectionQueue(token)
    //     }
    // }
    return {status_code: 200, message: 'success'}
}

/**
 * 处理紧急上行note队列
 * @param token
 * @param pub_key
 * @param platform
 * @param version
 * @returns {Promise<*>}
 */
exports.processUrgentNotePushQueue = async function (token, pub_key, platform = '', version = '') {
    const user_id = common.decodeDesktop(token)
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    await syncService.syncTool.deleteBatch('user_id= ' + user_id + ' and sync_type=21 and sync_direct=2 and sync_urgent=1 and status=1')
    const {status, data} = await syncService.processUrgentPushNotes(token, pub_key, platform, version, 60)
    // const push_note_count = await syncService.syncTool.userUrgentNoteCount(common.decodeDesktop(token), 21, 2)
    // if (push_note_count === 0) {
    //     const user_id = common.decodeDesktop(token)
    //     const urgent_download = await syncService.syncTool.downUrgentNotes(user_id)
    //     if (urgent_download.length === 0) {
    //         await pullRemoteCollectionQueue(token)
    //     }
    // }
    return {status_code: 200, message: 'success'}
}

/**
 * 清空collection同步记录
 * @param token
 * @returns {Promise<void>}
 */
exports.clearCompleteCollectionQueue = async function (token) {
    const user_id = common.decodeDesktop(token)
    // 转换未处理上行为紧急上行
    await syncService.syncTool.convertPushToUrgent(user_id)
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return ;
    }
    const down_urgent_list = await syncService.syncTool.downUrgentCollections(user_id)
    const urgent_note_list = await syncService.syncTool.downUrgentNotes(user_id)
    const down_list = await syncService.syncTool.downCollections(user_id)
    const push_list = await syncService.syncTool.pushCollections(user_id)
    const del_list = []
    for (const item of down_urgent_list) {
        del_list.push(item.id)
    }
    for (const item of urgent_note_list) {
        del_list.push(item.id)
    }
    for (const item of down_list) {
        del_list.push(item.id)
    }
    for (const item of push_list) {
        del_list.push(item.id)
    }
    if (del_list.length > 0) {
        await syncService.syncTool.deleteBatch('id in (' + del_list.join(',') + ')')
    }
    const urgent_upload = await syncService.syncTool.pushUrgentNotes(user_id)
    if (urgent_upload.length > 0) {
        return ;
    }
    // await pullRemoteCollectionQueue(token)
}

/**
 * 自动清理已完成同步队列
 * 无队列自动触发下行队列
 * @param token
 * @returns {Promise<boolean>}
 */
exports.autoClearCollectionQueue = async function (token) {
    const user_id = common.decodeDesktop(token)
    const urgent_download = await syncService.syncTool.downUrgentNotes(user_id)
    if (urgent_download.length > 0) {
        return false
    }
    const urgent_upload = await syncService.syncTool.pushUrgentNotes(user_id)
    if (urgent_upload.length > 0) {
        return false
    }
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return false
    }
    const down_list = await syncService.syncTool.downCollections(user_id)
    const push_list = await syncService.syncTool.pushCollections(user_id)
    const downs = [], pushes = []
    const del_list = []
    const down_note_count = await syncService.syncTool.userNoteCount(user_id, 21, 1)
    for (const item of down_list) {
        if (common.empty(down_note_count)) {
            del_list.push(item.id)
        } else {
            downs.push(item.id)
        }
    }
    for (const item of push_list) {
        // if (item.status === 1) {
        del_list.push(item.id)
        // } else {
        //     pushes.push(item.id)
        // }
    }
    if (del_list.length > 0) {
        await syncService.syncTool.deleteBatch('id in (' + del_list.join(',') + ')')
    }
    // if (downs.length === 0 && pushes.length === 0) {
    //     await syncService.syncTool.deleteBatch('user_id= ' + user_id + ' and sync_type=21 and sync_direct=1 and sync_urgent=0')
    //     await pullRemoteCollectionQueue(token)
    // }
}

exports.manualPushCollection = async function (token) {

}

/**
 * 自动下行同步已存在标签的置顶状态
 * @param token
 * @returns {Promise<void>}
 */
exports.pullTagTop = async function (token) {
    await syncService.pullTagTop(token)
}

/**
 * 推送标签置顶状态修改
 * @param token
 * @returns {Promise<void>}
 */
exports.pushTagTop = async function (token) {
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return ;
    }
    await syncService.pushLocalTagTop(token)
}

/**
 * 推送未成功的日志记录(1分钟调用一次)
 * @param token
 * @param version
 * @returns {Promise<*>}
 */
exports.uploadLog = async function (token, version = '') {
    const isOnline = await httpTool.initOnlineStatus()
    if (common.empty(isOnline)) {
        return {status_code: 400, message: '网络中断'}
    }
    const user_id = common.decodeDesktop(token)
    const list = await opLogTool.needUploadList(user_id, 30, 'id')
    if (common.empty(list)) {
        await opLogTool.clearInvaildLog(user_id)
        return {status_code: 400, message: '列表为空'}
    }
    for (const item of list) {
        await opLogTool.uploadLog(token, item.id, version)
    }
    await opLogTool.clearInvaildLog(user_id)
    return {status_code: 200, message: 'success'}
}

/**
 * 启动调用一次
 * 填充笔记无标签内容
 * @returns {Promise<void>}
 */
exports.fillNoteContent = async function () {
    await syncService.processFillNoteContent()
}

/**
 * 启动调用一次
 * 下拉远程note权重
 * @returns {Promise<void>}
 */
exports.pullRemoteNoteWeight = async function () {
    await syncService.pullRemoteNoteWeight()
}

/**
 * 启动调用一次
 * 修正错误权重信息
 * @returns {Promise<void>}
 */
exports.correctNoteWeight = async function () {
    await syncService.noteService.correctErrorWeight()
}

/**
 * 强制全量同步上行用户笔记
 * @param token
 * @returns {Promise<void>}
 */
exports.forceUrgentPushUserNotes = async function (token) {
    await syncService.forceUrgentPushUserNotes(token)
}

