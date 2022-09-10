const common = require('../tool/common');
const sd = require('silly-datetime');
const collectionService = require('../service/collection');
const noteService = require('../service/note');
const userService = require('../service/user');
const syncService = require('../service/sync');

/**
 * 新建collection
 * @param user_id
 * @param collection
 * @param color
 * @param parent_id
 * @returns {Promise<*>}
 */
exports.new = async function (user_id, collection, color, parent_id = 0) {
    user_id = common.decode(user_id)
    if (common.empty(collection)) {
        return {status_code: 400, message: 'collection不能为空', data: {}}
    }
    // 权限验证
    const user_right_result = await userService.userTool.userRights(user_id)
    if (!common.empty(user_right_result.is_base)) {
        const collection_count = await collectionService.collectionTool.collectCount(user_id)
        if (collection_count >= 5) {
            return {status_code: 401, message: '升级pro权限创建更多笔记本', data: {}}
        }
    }
    const collection_id = await collectionService.create(user_id, collection, color, parent_id)
    if (common.empty(collection_id)) {
        return {status_code: 400, message: '创建失败', data: {}}
    }
    const data = await collectionService.memberList(user_id, collection_id)
    const collection_info = await collectionService.collectionTool.get(collection_id)
    data.collection_id = common.encode(collection_id)
    data.collection = collection
    data.color = collection_info.color
    data.updated_at = collection_info.created_at
    await syncService.addCollectionPushQueue(user_id, collection_id)
    // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, collection_id)
    return {status_code: 200, message: 'success', data}
}

/**
 * 编辑collection
 * @param user_id
 * @param collection_id
 * @param collection
 * @param color
 * @param parent_id
 * @returns {Promise<*>}
 */
exports.edit = async function (user_id, collection_id, collection, color, parent_id = 0) {
    user_id = common.decode(user_id)
    if (common.empty(collection_id)) {
        return {status_code: 400, message: '原始Collection ID不能为空', data: {}}
    }
    collection_id = common.decode(collection_id)
    if (common.empty(collection)) {
        return {status_code: 400, message: 'collection不能为空', data: {}}
    }
    const record = await collectionService.collectionTool.get(collection_id, 'id,user_id,collection,color')
    if (common.empty(record)) {
        return {status_code: 417, message: '记录不存在', data: {}}
    } else if (parseInt(record.user_id) !== parseInt(user_id)) {
        return {status_code: 417, message: '非本人记录不可修改', data: {}}
    }
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    await collectionService.collectionTool.edit(collection_id, collection, color, save_time, parent_id)
    const data = await collectionService.memberList(record.user_id, collection_id)
    const collection_info = await collectionService.collectionTool.get(collection_id)
    data.collection_id = common.encode(collection_id)
    data.collection = collection
    data.color = collection_info.color
    data.updated_at = collection_info.updated_at
    await syncService.addCollectionPushQueue(user_id, collection_id)
    // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, collection_id)
    return {status_code: 200, message: 'success', data}
}

/**
 * 删除笔记本
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.remove = async function (user_id, collection_id) {
    user_id = common.decode(user_id)
    if (common.empty(collection_id)) {
        return {status_code: 400, message: '原始Collection ID不能为空', data: {}}
    }
    collection_id = common.decode(collection_id)
    const record = await collectionService.collectionTool.get(collection_id, 'id,user_id,collection,color')
    if (common.empty(record)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    if (record.user_id !== user_id) {
        return {status_code: 400, message: '权限错误', data: {}}
    }
    const note_count = await noteService.noteTool.count(user_id, {collection_id, is_group: 3, status: 2, note_type: -1})
    if (common.empty(note_count)) {
        await collectionService.collectionTool.remove(collection_id)
        await syncService.addCollectionPushQueue(user_id, collection_id)
        // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, collection_id)
        return {status_code: 200, message: 'success', data: {}}
    }
    return {status_code: 501, message: '请选择关联操作', data: {note_count}}
}

/**
 * 直接删除collection笔记
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.clearCollectionNotes = async function (user_id, collection_id) {
    user_id = common.decode(user_id)
    if (common.empty(collection_id)) {
        return {status_code: 400, message: '原始Collection ID不能为空', data: {}}
    }
    collection_id = common.decode(collection_id)
    const record = await collectionService.collectionTool.get(collection_id, 'id,user_id,collection,color')
    if (common.empty(record)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    if (record.user_id !== user_id) {
        return {status_code: 400, message: '权限错误', data: {}}
    }
    await collectionService.clearNotes(user_id, collection_id)
    await collectionService.collectionTool.remove(collection_id)
    await syncService.addCollectionPushQueue(user_id, collection_id)
    // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, collection_id)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 迁移collection笔记
 * @param user_id
 * @param target_id
 * @param source_id
 * @returns {Promise<*>}
 */
exports.moveCollectionNotes = async function (user_id, target_id, source_id) {
    user_id = common.decode(user_id)
    if (common.empty(target_id) || common.empty(source_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    target_id = common.decode(target_id)
    const target = await collectionService.collectionTool.get(target_id, 'id,user_id,collection,color')
    if (common.empty(target)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    if (target.user_id !== user_id) {
        return {status_code: 400, message: '权限错误', data: {}}
    }
    source_id = common.decode(source_id)
    const source = await collectionService.collectionTool.get(source_id, 'id,user_id,collection,color')
    if (common.empty(source)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    if (source.user_id !== user_id) {
        return {status_code: 400, message: '权限错误', data: {}}
    }
    await collectionService.moveNotes(user_id, target_id, source_id)
    await collectionService.collectionTool.remove(source_id)
    await syncService.addCollectionPushQueue(user_id, source_id)
    // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, source_id)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 我的collection列表
 * @param user_id
 * @param page
 * @param size
 * @returns {Promise<{status_code: number, data: {self_list, team_list}, message: string}>}
 */
exports.mine = async function (user_id, page, size) {
    user_id = common.decode(user_id)
    size = 1000
    const data = await collectionService.mine(user_id, page, size, ['id', 'user_id', 'collection', 'max_num', 'color', 'hash_code'])
    return {status_code: 200, message: 'success', data}
}

/**
 * collection排序
 * @param user_id
 * @param collection_ids
 * @returns {Promise<*>}
 */
exports.sort = async function (user_id, collection_ids) {
    if (common.empty(user_id) || common.empty(collection_ids)) {
        return {status_code: 400, message: '缺少参数'}
    }
    user_id = common.decode(user_id)
    collection_ids = collection_ids.split(',')
    for (const index in collection_ids) {
        collection_ids[index] = common.decode(collection_ids[index])
    }
    await collectionService.collectionTool.clearIndex(user_id)
    const {self_list, team_list} = await collectionService.group(collection_ids)
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    for (const index in self_list) {
        await collectionService.collectionTool.resort(user_id, self_list[index], index + 1, save_time)
        await syncService.addCollectionPushQueue(user_id, self_list[index])
        // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, self_list[index])
    }
    for (const index in team_list) {
        await collectionService.collectionTool.resort(user_id, team_list[index], index + 1, save_time)
        await syncService.addCollectionPushQueue(user_id, team_list[index])
        // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, team_list[index])
    }
    return {status_code: 200, message: 'success'}
}

/**
 * 设置collection最大标准值
 * @param user_id
 * @param collection_id
 * @param max_num
 * @returns {Promise<*>}
 */
exports.setMaxNum = async function (user_id, collection_id, max_num) {
    if (common.empty(user_id) || common.empty(collection_id)) {
        return {status_code: 400, message: '缺少参数'}
    }
    user_id = common.decode(user_id)
    collection_id = common.decode(collection_id)
    // 权限验证
    const user_right_result = await userService.userTool.userRights(user_id)
    if (common.empty(user_right_result.is_pro)) {
        return {status_code: 401, message: '升级pro权限可更改最大值', data: {}}
    }
    const record = await collectionService.collectionTool.get(collection_id, 'id,user_id,collection,color')
    if (common.empty(record)) {
        return {status_code: 400, message: '笔记本不存在'}
    }
    if (record.user_id !== user_id) {
        return {status_code: 400, message: '权限错误'}
    }
    await collectionService.collectionTool.setMaxNum(collection_id, max_num)
    await syncService.addCollectionPushQueue(user_id, collection_id)
    // await syncService.pushLocalCollection(common.encodeDesktop(user_id), '', user_id, collection_id)
    return {status_code: 200, message: 'success'}
}

/**
 * 紧急推送本地单个笔记本
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.urgentPush = async function (user_id, collection_id) {
    user_id = common.decode(user_id)
    collection_id = common.decode(collection_id)
    const user_right_result = await userService.userTool.userRights(user_id)
    if (common.empty(user_right_result.is_pro)) {
        return {status_code: 400, message: 'pro权限可以操作', data: {}}
    }
    const record = await collectionService.collectionTool.get(collection_id, 'id,user_id,collection')
    if (common.empty(record)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    const note_list = await noteService.noteTool.list(collection_id, user_id, 1, 'id, collection_id')
    if (note_list.length !== 0) {
        for (const note of note_list) {
            await syncService.initUrgentNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
            const sync_params = {note_id: note.id, collection_id: note.collection_id, sync_urgent: 1}
            await syncService.syncTool.create(user_id, 21, 2, sync_params)
        }
    }
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 紧急下拉单个笔记本
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.urgentPull = async function (user_id, collection_id) {
    user_id = common.decode(user_id)
    collection_id = common.decode(collection_id)
    const user_right_result = await userService.userTool.userRights(user_id)
    if (common.empty(user_right_result.is_pro)) {
        return {status_code: 400, message: 'pro权限可以操作', data: {}}
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: {}}
    }
    const record = await collectionService.collectionTool.get(collection_id, 'id,remote_id,user_id,collection')
    if (common.empty(record)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    const remote_id = record.remote_id
    if (common.empty(remote_id)) {
        return {status_code: 400, message: '笔记本未上传', data: {}}
    }
    let sync = await syncService.syncTool.urgentCollection(user_id, remote_id, 1, 1)
    if (!common.empty(sync)) {
        return {status_code: 400, message: '笔记本正在手动同步', data: {}}
    }
    const params = {collection_id: remote_id, sync_urgent: 1}
    await syncService.syncTool.create(user_id, 1, 1, params)
    return {status_code: 200, message: 'success', data: {}}
}
