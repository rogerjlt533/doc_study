const common = require('../tool/common');
const syncTool = require('../tool/sync');
const noteLogTool = require('../tool/notelog');
const collectionTool = require('../tool/collection');
const noteTool = require('../tool/note');
const httpTool = require('../tool/http');
const userTool = require('../tool/user')
const tagTool = require('../tool/tag')
const fingerService = require('./finger')
const noteService = require('./note')

exports.syncTool = syncTool

/**
 * 拉取远程collection列表
 * @param token
 * @returns {Promise<boolean>}
 */
exports.pullRemoteCollection = async function (token) {
    const user_id = common.decodeDesktop(token)
    // const list = await syncTool.pushCollections(user_id)
    // if (list.length > 0) {
    //     return false
    // }
    const sync_list = await syncTool.downCollections(user_id)
    if (sync_list.length > 0) {
        return false
    }
    const collections = await httpTool.get(httpTool.sync_host + 'api/desktop/down_flow/collection', {}, {hk: token})
    if (collections.code !== 200) {
        return false
    }
    await noteLogTool.deleteBatch('user_id=0 and action=0')
    // let last_id = await noteLogTool.getLastLogId()
    // const logs = await this.notelogs(token, common.empty(last_id) ? 0 : last_id)
    const pull_logs = await this.notelogs(token, 0)
    let local_logs = await noteLogTool.all('remote_id')
    local_logs = !common.empty(local_logs) ? local_logs : []
    local_logs = local_logs.map(item => item.remote_id)
    const logs = {}
    for (const note_id in pull_logs) {
        const remote_log = pull_logs[note_id]
        if (local_logs.indexOf(remote_log) === -1) {
            logs[note_id] = remote_log
        }
    }
    let my_collections = await collectionTool.joinedList(user_id, 'collection_id')
    my_collections = !common.empty(my_collections) ? my_collections : []
    let my_collection_list = my_collections.map(item => item.collection_id)
    let default_collection_id = 0
    for (const collection of collections.data) {
        const {init_status, local_collection, default_collection} = await this.initCollectionDownQueue(token, user_id, collection, logs)
        if (init_status && default_collection > 0) {
            default_collection_id = default_collection
        }
        my_collection_list = my_collection_list.filter(item => {return item !== local_collection})
    }
    await userTool.storeSetting(user_id, {default: default_collection_id})
    // 被移除的笔记本进行备份
    for (const my_collection_item of my_collection_list) {
        await this.processRemoteDeleted(my_collection_item)
    }
    return true
}

/**
 * 处理线上已删除的笔记本
 * 对于本地未上传的笔记进行备份
 * @param user_id
 * @param my_collection
 * @returns {Promise<boolean>}
 */
exports.processRemoteDeleted = async function (my_collection) {
    const collection_record = await collectionTool.getNoStatus(my_collection)
    if (common.empty(collection_record.remote_id)) {
        // 本地已删除，未上传的collection不处理
        if (common.empty(collection_record.deleted_at)) {
            await this.pushLocalCollection(common.encodeDesktop(collection_record.user_id), '', collection_record.user_id, my_collection)
        }
        return false
    }
    if (collection_record.assign_user_id === 1) {
        // 未进行第一次下行不处理
        return false
    }
    await syncTool.deleteBatch("sync_type=21 and sync_direct=2 and collection_id=" + my_collection)
    const notes = await noteTool.waitingPushNotes([my_collection], '*')
    // if (notes.length === 0) {
    //     await collectionTool.remove(my_collection)
    //     await this.pushLocalCollection(common.encodeDesktop(collection_record.user_id), '', collection_record.user_id, my_collection)
    //     return false
    // }
    let all_notes = await noteTool.collectionStatusNotes(my_collection, [0,1], 'id')
    all_notes = all_notes.map(item => item.id)
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    for (const note of notes) {
        all_notes = all_notes.filter(item => {return note.id !== item})
        if (!common.empty(note.deleted_at)) {
            continue
        }
        const user_id = note.user_id
        const default_collection = await userTool.getDefault(user_id)
        if (common.empty(default_collection)) {
            await noteTool.delete(note.id)
            await noteTool.removePostil(note.id)
            continue
        }
        await noteTool.history(note.id, 3, 3001, note.note, save_time, note.tag_json, note.struct_tag_json)
        await noteTool.changeCollection(note, default_collection)
        const postils = await noteTool.postils(note.id, 'id,note_id')
        for (const postil of postils) {
            const postil_note = await noteTool.get(postil.note_id, 'id,user_id')
            if (postil_note.user_id !== user_id) {
                await noteTool.removePostil(postil.note_id, note.id)
            }
        }
        await this.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
        const params = {note_id: note.id, collection_id: default_collection}
        await syncTool.create(user_id, 21, 2, params)
    }
    const note_collection = await collectionTool.getNoStatus(my_collection)
    for (const note_id of all_notes) {
        const note = await noteTool.getNoStatus(note_id)
        note.note_id = common.encode(note.remote_id)
        note.hash_md5 = note.hash_code
        await this.initNoteDownQueue(note.user_id, note_collection.remote_id, note)
    }
    // console.log(note_collection)
    await collectionTool.remove(my_collection)
    await this.pushLocalCollection(common.encodeDesktop(note_collection.user_id), '', note_collection.user_id, my_collection)
    return true
}

/**
 * 初始化同步队列
 * @param token
 * @param userid
 * @param data
 * @param logs
 * @returns {Promise<*>}
 */
exports.initCollectionDownQueue = async function (token, userid, data, logs) {
    const {id, collection, color, user_id, sort_index, members, is_default, created_at, deleted_at} = data
    const remote_id = common.decode(id)
    const remote_userid = common.decode(user_id)
    let record = await collectionTool.remote(remote_id)
    if (common.empty(record) && !common.empty(deleted_at)) {
        return {init_status: false, local_collection: 0, default_collection: 0}
    }
    if (!common.empty(deleted_at) && !common.empty(record)) {
        await collectionTool.remove(record.id)
        await this.pushLocalCollection(token, '', userid, record.id)
        return {init_status: true, local_collection: record.id, default_collection: 0}
    }
    if (!common.empty(record)) {
        await collectionTool.setAssignUserId(record.id, 0)
    }
    let collection_id = 0
    if (common.empty(record)) {
        collection_id = await collectionTool.createRemote(remote_userid, remote_id, collection, color, created_at, 0)
        if (common.empty(collection_id)) {
            record = await collectionTool.remote(remote_id)
            collection_id = !common.empty(record) ? record.id : 0
        }
        await collectionTool.setRemote(collection_id, remote_id)
    } else {
        collection_id = record.id
        await collectionTool.edit(collection_id, collection, color, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), 0)
    }
    if (common.empty(collection_id)) {
        return {init_status: false, local_collection: collection_id, default_collection: 0}
    }
    if (sort_index >= 0) {
        await collectionTool.resort(userid, collection_id, sort_index, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))
    }
    // sync_type=1 and sync_direct=1
    let sync = await syncTool.collection(userid, remote_id, 1, 1)
    if (common.empty(sync)) {
        const params = {collection_id: remote_id}
        if (!common.empty(deleted_at)) {
            params.deleted_time = deleted_at
        }
        const sync_id = await syncTool.create(userid, 1, 1, params)
        await syncTool.status(sync_id, 1)
    } else {
        await syncTool.status(sync.id, 1)
    }
    // 成员同步
    for (const member of members) {
        await userTool.initUserInfo(common.decode(member.id), member)
        await collectionTool.join(common.decode(member.id), collection_id, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))
        // 桌面端无团队成员操作前不启用
        // await syncTool.create(userid, 2, 1, {collection_id: id, member_id: common.decode(member.id), member_name: member.name, member_avatar: member.avatar})
    }
    // 初始化note 队列
    const note_result = await httpTool.get(httpTool.sync_host + 'api/desktop/note_hash', {collection_id: common.encode(remote_id)}, {hk: token})
    if (note_result.code === 200 && note_result.data.length > 0) {
        for (const note of note_result.data) {
            const {note_id} = note
            const remote_note_id = common.decode(note_id)
            const remote_log_id = logs[remote_note_id]
            if (common.empty(remote_log_id)) {
                continue
            }
            await noteLogTool.initRemote(remote_log_id, remote_note_id)
            // if (!common.empty(remote_log_id)) {
            //     if (common.empty(log_id)) {
            //         continue
            //     }
            // }
            await this.initNoteDownQueue(userid, remote_id, note)
        }
    }
    return {init_status: true, local_collection: collection_id, default_collection: is_default > 0 ? collection_id: 0}
}

/**
 * 初始collection推送队列
 */
exports.initCollectionPushQueue = async function (user_id, data) {
    const sync = await syncTool.collection(user_id, data.id, 1, 2)
    if (common.empty(sync)) {
        const params = {collection_id: data.id}
        await syncTool.create(user_id, 1, 2, params)
    }
}

/**
 * 初始化collection信息
 * @param token
 * @param pub_key
 * @param remote_id
 * @returns {Promise<boolean>}
 */
exports.initCollection = async function (token, pub_key, remote_id) {
    const collection_id = JSON.stringify([common.encode(remote_id)])
    const collections = await httpTool.get(httpTool.sync_host + 'api/desktop/v2/down_flow/collection', {collection_id}, {hk: token})
    if (collections.code !== 200) {
        return false
    }
    for (const data of collections.data) {
        data.id = common.decode(data.id)
        data.user_id = common.decode(data.user_id)
        const {id, user_id, collection, color, sort_index, created_at, deleted_at, members} = data
        let record = await collectionTool.remote(id)
        if (common.empty(record) && !common.empty(deleted_at)) {
            return false
        }
        let collection_id = 0
        if (common.empty(record)) {
            collection_id = await collectionTool.createRemote(user_id, remote_id, collection, color, created_at, 0)
            if (common.empty(collection_id)) {
                record = await collectionTool.remote(remote_id)
                collection_id = !common.empty(record) ? record.id : 0
            }
        } else {
            collection_id = record.id
            await collectionTool.edit(collection_id, collection, color, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), 0)
        }
        if (common.empty(collection_id)) {
            continue
        }
        if (sort_index >= 0) {
            await collectionTool.resort(user_id, collection_id, sort_index, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))
        }
        // 成员同步
        for (const member of members) {
            await userTool.initUserInfo(common.decode(member.id), member)
            await collectionTool.join(common.decode(member.id), collection_id, common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))
            // 桌面端无团队成员操作前不启用
            // await syncTool.create(userid, 2, 1, {collection_id: id, member_id: common.decode(member.id), member_name: member.name, member_avatar: member.avatar})
        }
    }
    return true
}

/**
 * 拉取note下行队列
 * @param token
 * @returns {Promise<boolean>}
 */
exports.pullRemoteNotes = async function (token) {
    const user_id = common.decodeDesktop(token)
    const collections = await syncTool.downCollections(user_id)
    if (collections.length === 0) {
        // 无可处理队列
        return false
    }
    const waiting_collections = collections.filter(item => {return item.status === 0})
    if (waiting_collections.length !== collections.length) {
        return false
    }
    let last_id = await noteLogTool.getLastLogId()
    const logs = await this.notelogs(token, common.empty(last_id) ? 0 : last_id)
    let collection_id = 0, sync_record = null
    for (const item of collections) {
        if (item.status !== 0) {
            sync_record = item
            collection_id = item.collection_id
            await syncTool.status(item.id, 1)
            break
        }
    }
    if (common.empty(collection_id)) {
        return false
    }
    const data = await httpTool.get(httpTool.sync_host + 'api/desktop/note_hash', {collection_id: common.encode(collection_id)}, {hk: token})
    if (data.code !== 200) {
        return false
    }
    if (data.code === 200 && data.data.length > 0) {
        for (const note of data.data) {
            await this.initNoteDownQueue(user_id, collection_id, note)
        }
    }
    return true
}

/**
 * 获取并格式化log数据
 * @param token
 * @param last
 * @returns {Promise<{}>}
 */
exports.notelogs = async function (token, last) {
    const result = await httpTool.get(httpTool.sync_host + 'api/desktop/note_log', {last}, {hk: token})
    if (result.code !== 200) {
        return {}
    }
    if (result.data.length === 0) {
        return {}
    }
    const data = {}
    for (const item of result.data) {
        const note_id = common.decode(item.note_id)
        const log_id = common.decode(item.log_id)
        data[note_id] = log_id
    }
    return data
}

/**
 * 同步下行collection计数
 * @param token
 * @param collection_id
 * @returns {Promise<boolean>}
 */
exports.syncPullCollectionRemoteNoteCount = async function(token, collection_id) {
    const user_id = common.decodeDesktop(token)
    const data = await httpTool.get(httpTool.sync_host + 'api/desktop/notes_num', {collection_id: common.encode(collection_id)}, {hk: token})
    // console.log(data)
    if (data.code !== 200) {
        return false
    }
    let all_count = 0
    if (data.code === 200) {
        all_count = parseInt(data.data.all)
    }
    const rows = await syncTool.collectionNotes(user_id, collection_id, 1, 0, 'distinct note_id')
    if (rows.length === all_count) {
        return false
    }
    const exist_list = []
    for (const item of rows) {
        exist_list.push(item.note_id)
    }
    const result = await httpTool.get(httpTool.sync_host + 'api/desktop/note_hash', {collection_id: common.encode(collection_id)}, {hk: token})
    if (result.code === 200 && result.data.length > 0) {

        for (const note of result.data) {
            const note_id = common.decode(note.note_id)
            if (exist_list.indexOf(note_id) === -1) {
                await this.initNoteDownQueue(user_id, collection_id, note)
            }
        }
    }
    return true
}

/**
 * 初始化note下行队列
 * @param user_id
 * @param collection_id
 * @param note
 * @returns {Promise<boolean>}
 */
exports.initNoteDownQueue = async function (user_id, collection_id, note) {
    const {note_id, hash_md5, deleted_at, status} = note
    const remote_id = common.decode(note_id)
    const record = await noteTool.remote(remote_id)
    if (common.empty(record) && !common.empty(deleted_at)) {
        return false
    }
    const sync = await syncTool.note(user_id, remote_id, 21, 1)
    if (common.empty(sync)) {
        const params = {note_id: remote_id, collection_id, note_status: status, hash_code: hash_md5}
        if (!common.empty(deleted_at)) {
            params.deleted_time = deleted_at
        }
        await syncTool.create(user_id, 21, 1, params)
    }
}

/**
 * 初始化上行note列表
 * @param collection_id
 * @param note
 * @returns {Promise<void>}
 */
exports.initNotePushQueue = async function (collection_id, note) {
    const {id, user_id} = note
    const sync = await syncTool.note(user_id, id, 21, 2)
    if (common.empty(sync)) {
        const params = {note_id: id, collection_id}
        await syncTool.create(user_id, 21, 2, params)
    }
}

/**
 * 获取远程notes
 * @param token
 * @param pub_key
 * @param limit
 * @returns {Promise<*>}
 */
exports.getDownNotes = async function (token, pub_key, limit = 10) {
    const user_id = common.decodeDesktop(token)
    await syncTool.deleteBatch('user_id= ' + user_id + ' and sync_type=21 and sync_direct=1 and status=1')
    const sync_list = await syncTool.downNotes(user_id, limit)
    if (sync_list.length === 0) {
        return {status: true, data: []}
    }
    const sync_map = {}
    for (const item of sync_list) {
        if (item.postil_id > 0) {
            if (!sync_map.hasOwnProperty(item.note_id)) {
                sync_map[item.note_id] = []
            }
            sync_map[item.note_id].push(item.postil_id)
        }
    }
    const sync_ids = common.list_column(sync_list, 'id')
    // 批量修改同步记录状态位已修改
    await syncTool.statusBatch(sync_ids, 1)
    let notes = common.list_column(sync_list, 'note_id')
    notes = notes.map(item => common.encode(item))
    // const encrypted = common.publicEncrypt(pub_key, JSON.stringify(notes))
    const result = await httpTool.post(httpTool.sync_host + 'api/desktop/down_flow/note', {notes: JSON.stringify(notes)}, {hk: token})
    if (result.code !== 200) {
        return {status: false, data: []}
    }
    for (const index in result.data) {
        const note_id = common.decode(result.data[index].note.id)
        result.data[index]['postil'] = []
        if (sync_map.hasOwnProperty(note_id)) {
            result.data[index]['postil'] = sync_map[note_id]
        }
    }
    return {status: true, data: result.data}
}

/**
 * 重加载未上行笔记队列
 * @param token
 * @returns {Promise<boolean>}
 */
exports.reloadPushNotes = async function (token) {
    const user_id = common.decodeDesktop(token)
    const sync_list = await syncTool.pushNotes(user_id)
    const sync_notes = common.list_column(sync_list, 'note_id')
    let joinedList = await collectionTool.joinedList(user_id, 'collection_id')
    joinedList = joinedList.map((item) => { return item.collection_id })
    let waiting_list = await noteTool.waitingPushNotes(joinedList)
    if (waiting_list.length === 0) {
        return false
    }
    waiting_list = waiting_list.filter(item => { return sync_notes.indexOf(item.id) === -1 }).map(item => item.id)
    if (waiting_list.length === 0) {
        return false
    }
    for (const note_id of waiting_list) {
        const note = await noteTool.getNoStatus(note_id)
        await this.initNoteQuoteQueue(token, '', user_id, note)
        const params = {note_id, collection_id: note.collection_id}
        await syncTool.create(user_id, 21, 2, params)
    }
    return true
}

/**
 * 上传本地notes
 * @param token
 * @param pub_key
 * @param platform
 * @param version
 * @param limit
 * @returns {Promise<*>}
 */
exports.getPushNotes = async function (token, pub_key, platform = '', version = '', limit = 10) {
    await this.reloadPushNotes(token)
    const user_id = common.decodeDesktop(token)
    const sync_list = await syncTool.pushNotes(user_id, limit)
    if (sync_list.length === 0) {
        return {status: false, data: []}
    }
    const sync_ids = common.list_column(sync_list, 'id')
    // 批量删除同步记录
    await syncTool.deleteBatch('id in (' + sync_ids.join(',') + ')')
    for (const sync of sync_list) {
        const note = await noteTool.getNoStatus(sync.note_id)
        if (!common.empty(note.deleted_at) && common.empty(note.remote_id)) {
            continue
        }
        await this.pushLocalCollection(token, pub_key, user_id, note.collection_id)
        const collection = await collectionTool.getNoStatus(note.collection_id)
        const postils = await noteTool.postils(note.id, 'note_id')
        let quotes = []
        for (const note_id of common.list_column(postils, 'note_id')) {
            const postil = await noteTool.get(note_id, 'remote_id, id as desktop_id')
            postil.remote_id = common.encode(postil.remote_id)
            postil.desktop_id = common.encode(postil.desktop_id)
            quotes.push(postil)
        }
        if (note.note === undefined || note.note === null || note.note === '') {
            continue
        }
        const json = {
            note: note.note,
            collection_id: common.encode(collection.remote_id),
            tags: !common.empty(note.tag_json) ? JSON.parse(note.tag_json) : [],
            created_at: note.created_at,
            remote_id: common.encode(note.remote_id),
            desktop_id: common.encode(note.id),
            last_update: note.last_update,
            deleted_at: note.deleted_at,
            note_type: note.note_type,
            tag_json: note.tag_json,
            status: note.status,
            struct_tags: note.struct_tag_json,
            quotes
        }
        // const encrypted = common.publicEncrypt(pub_key, )
        console.log(JSON.stringify(json))
        const result = await httpTool.post(httpTool.host + 'api/desktop/up_flow/note', {note: JSON.stringify(json)}, {hk: token, platform, version})
        console.log(result)
        if (result.code !== 200) {
            continue
            // return {status: false, data: []}
        }
        // 设置远程ID
        await noteTool.setRemote(note.id, common.decode(result.data.note_id))
    }
    return {status: true, data: []}
}

/**
 * 处理下行引用
 * @param token
 * @param pub_key
 * @param note_id
 * @returns {Promise<*>}
 */
exports.processDownQuotes = async function (token, pub_key, note_id) {
    const user_id = common.decodeDesktop(token)
    const notes = JSON.stringify([common.encode(note_id)])
    // const encrypted = common.publicEncrypt(pub_key, JSON.stringify(notes))
    const result = await httpTool.post(httpTool.sync_host + 'api/desktop/v2/down_flow/quotes', {note: notes}, {hk: token})
    if (result.code !== 200) {
        return false
    }
    const quote_map = common.array_map(result.data, 'note_id', 'quote')
    for (const note_key in quote_map) {
        if (quote_map.length === 0) {
            continue
        }
        const postil_id = common.decode(note_key)
        for (const quote_item of quote_map[note_key]) {
            const remote_id = common.decode(quote_item.note_id)
            if (common.empty(remote_id)) {
                continue
            }
            const collection_id = common.decode(quote_item.collection_id)
            await this.initCollection(token, pub_key, collection_id)
            const params = {note_id: remote_id, postil_id, collection_id, note_status: quote_item.status, hash_code: quote_item.hash_md5}
            if (!common.empty(quote_item.deleted_at)) {
                params.deleted_time = quote_item.deleted_at
            }
            await syncTool.create(user_id, 21, 1, params)
        }
    }
    return true
}

/**
 * 移除下行collection同步记录
 * @param user_id
 * @returns {Promise<*>}
 */
exports.removeDownRemoteCollection = async function (user_id) {
    const syncs = await syncTool.downCollections(user_id)
    if (syncs.length === 0) {
        return 0
    }
    for (const sync_item of syncs) {
        if (sync_item.status === 0) {
            continue
        }
        const down_list = await syncTool.collectionStatusNotes(user_id, sync_item.collection_id, [0], 1, 1, 'id')
        const bak_list = await syncTool.collectionNotes(user_id, sync_item.collection_id, 3, 1)
        if (down_list.length === 0 && bak_list.length === 0) {
            await syncTool.delete(sync_item.id)
            // 删除note同步记录
            await syncTool.deleteBatch('user_id= ' + user_id + ' and collection_id=' + sync_item.collection_id + ' and sync_type=21 and sync_direct=1')
        }
    }
    return 0
}

/**
 * 移除上行collection同步记录
 * @param user_id
 * @returns {Promise<*>}
 */
exports.removePushLocalCollection = async function (user_id) {
    const syncs = await syncTool.pushCollections(user_id)
    if (syncs.length === 0) {
        return 0
    }
    for (const sync_item of syncs) {
        if (sync_item.status === 0) {
            continue
        }
        const up_list = await syncTool.collectionNotes(user_id, sync_item.collection_id, 2, 2)
        if (up_list.length === 0) {
            await syncTool.delete(sync_item.id)
        }
    }
    return 0
}

/**
 * 处理下行笔记队列
 * @param token
 * @param pub_key
 * @param note
 * @returns {Promise<number>}
 */
exports.processDownNote = async function (token, pub_key, note) {
    const info = note.note
    info.id = common.decode(info.id)
    info.user_id = common.decode(info.user_id)
    info.last_update = common.empty(info.last_update) ? info.created_at : info.last_update
    let tag_json = note.properties.tag_json
    const latest_log = note.latest_log
    if (!common.empty(latest_log)) {
        const last_log_id = common.decode(latest_log.log_id)
        const last_note_id = common.decode(latest_log.note_id)
        await noteLogTool.updateRemote(last_log_id, info.user_id, last_note_id, latest_log.action, latest_log.created_at, latest_log.created_at, latest_log.created_at)
    }
    tag_json = common.empty(tag_json) ? '[]' : tag_json
    let struct_tag_json = note.properties.struct_tag_json
    struct_tag_json = common.empty(struct_tag_json) ? '[]' : struct_tag_json
    const collection = note.collection
    collection.id = common.decode(collection.id)
    const collection_record = await collectionTool.remote(collection.id)
    const pics = note.pics
    // const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    let record = await noteTool.remote(info.id)
    let postil_list = []
    if (note.postil.length > 0) {
        for (const remote_postil of note.postil) {
            const postil_record = await noteTool.remote(remote_postil)
            if (!common.empty(postil_record)) {
                postil_list.push(postil_record)
            }
        }
    }
    for (const image of pics) {
        // 处理图片资源
        await fingerService.storeNoteRemote(info.user_id, !common.empty(record) ? record.id : 0, image.finger, image.finger.remote_create_time)
    }
    if (common.empty(record) && !common.empty(info.deleted_at)) {
        return -2
    }
    if (common.empty(info?.id) || common.empty(collection_record?.id)) {
        return -4;
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (common.empty(record)) {
        // 本地已删除
        const trashed = await noteTool.remoteDestroyed(info.id)
        if (!common.empty(trashed) && common.empty(info.deleted_at)) {
            // 云端未删除、本地已删除，通知云端删除
            const exists = await syncTool.note(info.user_id, trashed.id, 21, 2)
            if (common.empty(exists)) {
                const params = {note_id: trashed.id, collection_id: trashed.collection_id, note_status: trashed.status, hash_code: trashed.hash_code, deleted_time: trashed.deleted_at}
                await syncTool.create(info.user_id, 21, 2, params)
            }
            return -3
        }
        // 直接创建
        let note_id = await noteTool.storeRemote(info.id, info.user_id, collection_record.id, info.note_type, info.source, info.note, info.url, tag_json, info.hash_md5, struct_tag_json, info.status, info.created_at, info.last_update, info.last_update)
        await noteService.bindTags(info.user_id, note_id, JSON.parse(tag_json))
        if (info.note_type === 2) {
            await noteService.bindStructTags(info.user_id, note_id, JSON.parse(struct_tag_json))
        }
        if (postil_list.length > 0) {
            for (const postil_record of postil_list) {
                await noteTool.postil(note_id, postil_record.id)
            }
        }
        // 同步引用
        await this.processDownQuotes(token, pub_key, info.id)
    } else if (info.hash_md5 === record.hash_code) {
        // 本地未删除、hash一致
        const cmp_status = common.compareTime(info.last_update, record.last_update)
        if (!common.empty(info.deleted_at)) {
            await noteTool.delete(record.id)
            await noteTool.removePostil(record.id)
            // if (cmp_status >= 0) {
            //     await noteTool.delete(record.id)
            //     await noteTool.removePostil(record.id)
            //     return -1
            // } else {
            //     // 云端删除状态下，本地状态有修改，copy一份新的，需要等待同步引用
            //     // TODO: copy as new note
            //     const params = {collection_id: collection.id, note_id: info.id, note_status: record.status, hash_code: record.hash_code}
            //     await syncTool.create(info.user_id, 21, 3, params)
            //     return -1
            // }
        } else if (cmp_status >= 0) {
            // 远程最新装进废纸篓
            if (info.status === 0) {
                await noteTool.remove(record.id, save_time)
            }
            let relations = await tagTool.noteTagRelations(record.id, 'id')
            relations = common.list_column(relations, 'id')
            const edit_relations = await noteService.bindTags(info.user_id, record.id, JSON.parse(tag_json))
            // 删除失效的标签关联
            relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
            for (const item of relations) {
                await tagTool.unbindNote(item)
            }
            if (note.note_type === 2) {
                await tagTool.clearNoteTagNode(record.id)
                await noteService.bindStructTags(info.user_id, record.id, JSON.parse(struct_tag_json))
            }
            if (postil_list.length > 0) {
                for (const postil_record of postil_list) {
                    await noteTool.postil(record.id, postil_record.id)
                }
            }
            // 同步引用
            await this.processDownQuotes(token, pub_key, info.id)
        }
    } else {
        // 本地未删除、hash不一致
        const cmp_status = common.compareTime(info.last_update, record.last_update)
        if (cmp_status >= 0) {
            if (!common.empty(info.deleted_at)) {
                // 远程删除最新
                await noteTool.delete(record.id)
                await noteTool.removePostil(record.id)
                return -1
            } else if (common.empty(collection_record)) {
                // 非权限内的笔记直接删除、不同步上去
                await noteTool.delete(record.id)
                await noteTool.removePostil(record.id)
                return -1
            } else {
                //直接覆盖
                await noteTool.storeRemote(info.id, info.user_id, collection_record.id, info.note_type, info.source, info.note, info.url, tag_json, info.hash_md5, struct_tag_json, info.status, info.created_at, info.last_update, info.last_update)
                let relations = await tagTool.noteTagRelations(record.id, 'id')
                relations = common.list_column(relations, 'id')
                const edit_relations = await noteService.bindTags(info.user_id, record.id, JSON.parse(tag_json))
                // 删除失效的标签关联
                relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
                for (const item of relations) {
                    await tagTool.unbindNote(item)
                }
                if (note.note_type === 2) {
                    await tagTool.clearNoteTagNode(record.id)
                    await noteService.bindStructTags(info.user_id, record.id, JSON.parse(struct_tag_json))
                }
                if (postil_list.length > 0) {
                    for (const postil_record of postil_list) {
                        await noteTool.postil(record.id, postil_record.id)
                    }
                }
                // 同步引用
                await this.processDownQuotes(token, pub_key, info.id)
            }
        } else {
            // 本地为新的
            if (!common.empty(info.deleted_at)) {
                await noteTool.delete(record.id)
                await noteTool.removePostil(record.id)
            } else {
                // 以本地为准向上同步
                const exists = await syncTool.note(info.user_id, record.id, 21, 2)
                if (common.empty(exists)) {
                    const params = {note_id: record.id, collection_id: record.collection_id, note_status: record.status, hash_code: record.hash_code, deleted_time: record.deleted_at}
                    await syncTool.create(info.user_id, 21, 2, params)
                }
                return -1
            }
        }
    }
    return 0
}

/**
 * 获取图片
 * @param token
 * @param pub_key
 * @param path
 * @returns {Promise<*>}
 */
exports.getDownImage = async function (token, pub_key, path) {
    const params = {}
    if (!common.empty(path)) {
        params.path = path
    }
    const result = await httpTool.post(httpTool.sync_host + 'api/desktop/down_flow/images', params, {hk: token})
    if (result.code !== 200) {
        return {status: false, data: []}
    }
    return {status: true, data: result.data}
}

/**
 * 推送本地collection
 * @param token
 * @param pub_key
 * @param user_id
 * @param collection_id
 * @returns {Promise<boolean>}
 */
exports.pushLocalCollection = async function (token, pub_key, user_id, collection_id) {
    const sync_record = await syncTool.collection(user_id, collection_id, 1, 2)
    if (!common.empty(sync_record)) {
        return false
    }
    const collection_record = await collectionTool.getNoStatus(collection_id)
    if (collection_record.user_id !== user_id) {
        return true
    }
    const sync_id = await syncTool.create(user_id, 1, 2, {collection_id})
    const {relate, sort_index} = await collectionTool.userIndex(user_id, collection_id)
    const up_params = {
        desktop_id: common.encode(collection_id),
        remote_id: common.encode(collection_record.remote_id),
        collection: collection_record.collection,
        color: collection_record.color,
        sort_index,
        created_at: collection_record.created_at,
        updated_at: collection_record.updated_at,
        deleted_at: collection_record.deleted_at
    }
    // console.log({collection: common.publicEncrypt(pub_key, JSON.stringify(up_params))})
    // 向云端同步collection
    const data = await httpTool.post(httpTool.host + 'api/desktop/up_flow/collection', {collection: JSON.stringify(up_params)}, {hk: token})
    if (data.code !== 200) {
        await syncTool.delete(sync_id)
        return false
    }
    if (collection_record.remote_id <= 0) {
        await collectionTool.setRemote(collection_id, common.decode(data.data.id))
    }
    await syncTool.delete(sync_id)
    return true
}

/**
 * 初始化笔记本上行队列
 * @param token
 * @param pub_key
 * @returns {Promise<boolean>}
 */
exports.pushLocalNotes = async function (token, pub_key) {
    const user_id = common.decodeDesktop(token)
    const collections = await syncTool.pushCollections(user_id)
    if (collections.length === 0) {
        // 无可处理队列
        return false
    }
    let collection_id = 0, sync_record = null
    for (const item of collections) {
        if (item.status === 0) {
            sync_record = item
            collection_id = item.collection_id
            await syncTool.status(item.id, 1)
            break
        }
    }
    if (common.empty(collection_id)) {
        return false
    }
    const up_res = await this.pushLocalCollection(token, pub_key, user_id, collection_id)
    if (!up_res) {
        return false
    }
    const list = await noteTool.list(collection_id, user_id, 2, 'id,collection_id,user_id')
    if (list.length === 0) {
        // 线上、线下都是空、如有删除同步，执行删除
        await syncTool.delete(sync_record.id)
        return true
    }
    for (const note of list) {
        await this.initNoteQuoteQueue(token, pub_key, user_id, note)
        await this.initNotePushQueue(collection_id, note)
    }
    return true
}

/**
 * 初始化引用同步队列
 * @param token
 * @param pub_key
 * @param user_id
 * @param record
 * @returns {Promise<Array>}
 */
exports.initNoteQuoteQueue = async function (token, pub_key, user_id, record) {
    const quotes = await noteTool.postils(record.id, 'note_id,postil_id')
    if (quotes.length === 0) {
        return []
    }
    for (const quote of quotes) {
        const note = await noteTool.get(quote.note_id)
        if (note.user_id !== user_id) {
            continue
        }
        await this.pushLocalCollection(token, pub_key, user_id, note.collection_id)
        await this.initNotePushQueue(note.collection_id, note)
        await this.initNoteQuoteQueue(token, pub_key, note.user_id, note)
    }
    return quotes
}