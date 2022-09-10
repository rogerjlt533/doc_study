const common = require('../tool/common');
const collectionService = require('../service/collection');
const noteService = require('../service/note');
const userService = require('../service/user');
const tagService = require('../service/tag');
const syncService = require('../service/sync')

/**
 * 创建笔记
 * @param user_id
 * @param collection_id
 * @param note_type
 * @param source
 * @param content
 * @param url
 * @param postil_list
 * @param tag_list
 * @param struct_list
 * @returns {Promise<*>}
 */
exports.new = async function (user_id, collection_id, note_type, source, content, url, postil_list, tag_list, struct_list) {
    user_id = common.decode(user_id)
    if (common.empty(collection_id)) {
        const user_setting = await userService.userTool.setting(user_id)
        collection_id = common.empty(user_setting) ? 0 : user_setting.default
    } else {
        collection_id = common.decode(collection_id)
    }
    if (common.empty(collection_id)) {
        const user_setting = await userService.userTool.setting(user_id)
        collection_id = !common.empty(user_setting) ? user_setting.default : 0
    }
    if (common.empty(collection_id) || common.empty(content)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const collection = await collectionService.collectionTool.get(collection_id, ['collection', 'color', 'user_id', 'hash_code'].join(','))
    if (common.empty(collection)) {
        return {status_code: 400, message: '笔记本不存在', data: {}}
    }
    postil_list = common.empty(postil_list) ? [] : postil_list
    tag_list = common.empty(tag_list) ? [] : tag_list
    struct_list = common.empty(struct_list) ? [] : struct_list
    // 去掉末尾的空格 @Ivone
    content = content.trimEnd()
    const note_id = await noteService.noteTool.create(user_id, collection_id, note_type, source, content, common.empty(url) ? '' : url, JSON.stringify(tag_list), JSON.stringify(struct_list))
    if (common.empty(note_id)) {
        return {status_code: 500, message: '记录创建失败', data: {}}
    }
    for (const postil of postil_list) {
        if (!common.empty(postil)) {
            await noteService.noteTool.postil(common.decode(postil), note_id)
        }
    }
    await noteService.bindTags(user_id, note_id, tag_list)
    if (note_type === 2) {
        await noteService.bindStructTags(user_id, note_id, struct_list)
    }
    const note = await noteService.noteTool.get(note_id)
    const tags = await tagService.tagTool.noteTags(note_id)
    const quote = await noteService.noteQuote({id: note_id})
    const data = {
        id: common.encode(note_id),
        remote_id: '',
        collection_id: common.encode(collection_id),
        hash_code: note.hash_code,
        todo_id: common.encode(0),
        is_share: 0,
        share_code: '',
        tags,
        note: content,
        quote: quote.quote,
        created_at: note.created_at,
        updated_time: note.updated_at,
        collection: {
            is_team: collection.user_id !== user_id ? 1 : 0,
            collection: collection.collection,
            color: collection.color,
            hash_code: collection.hash_code
        },
        is_self: 1,
        note_type,
        url: note.url
    }
    await syncService.addNotePushQueue(user_id, note_id)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    // const params = {note_id, collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data}
}

/**
 * 更换笔记本
 * @param user_id
 * @param note_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.changeCollection = async function (user_id, note_id, collection_id) {
    user_id = common.decode(user_id)
    note_id = common.decode(note_id)
    collection_id = common.decode(collection_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note) || common.empty(collection_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const origin_collection_id = note.collection_id
    if (parseInt(origin_collection_id) === parseInt(collection_id)) {
        return {status_code: 400, message: '同步笔记本,无需变更', data: {}}
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, note.collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可修改', data: {}}
    }
    await noteService.noteTool.changeCollection(note, collection_id)
    await syncService.addNotePushQueue(user_id, note_id)
    // const params = {note_id, collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 编辑笔记
 * @param user_id
 * @param note_id
 * @param collection_id
 * @param content
 * @param postil_list
 * @param tag_list
 * @param struct_list
 * @returns {Promise<*>}
 */
exports.edit = async function (user_id, note_id, collection_id, content, postil_list, tag_list, struct_list) {
    user_id = common.decode(user_id)
    note_id = common.decode(note_id)
    let note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const origin_note_hash = note.hash_code
    const origin_collection_id = note.collection_id
    if (!common.empty(collection_id)) {
        collection_id = common.decode(collection_id)
    } else {
        collection_id = origin_collection_id
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, note.collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: {}}
    }
    let collection = group_res.collection
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可修改', data: {}}
    }
    let save_time = note.last_update
    let relations = await tagService.tagTool.noteTagRelations(note_id, 'id')
    relations = common.list_column(relations, 'id')
    if (content !== note.note) {
        save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        await noteService.noteTool.history(note_id, 2, 2001, note.note, save_time, note.tag_json, note.struct_tag_json)
        if (note.note_type === 1) {
            await noteService.noteTool.updateNoteWeight(note_id, 1, save_time)
        }
    }
    // 去掉末尾的空格 @Ivone
    content = content.trimEnd()
    await noteService.noteTool.update(note_id, collection_id, content, JSON.stringify(tag_list), JSON.stringify(struct_list), save_time, note.updated_at)
    let origin_postil_list = await noteService.noteTool.postils(note_id, 'note_id')
    origin_postil_list = common.list_column(origin_postil_list, 'note_id')
    let compare_origin_postil_list = JSON.parse(JSON.stringify(origin_postil_list))
    postil_list = common.empty(postil_list) ? [] : postil_list
    tag_list = common.empty(tag_list) ? [] : tag_list
    struct_list = common.empty(struct_list) ? [] : struct_list
    for (const postil of postil_list) {
        if (!common.empty(postil)) {
            compare_origin_postil_list = compare_origin_postil_list.filter(origin_item => origin_item !== common.decode(postil))
            await noteService.noteTool.postil(common.decode(postil), note_id)
        }
    }
    // 删除无效引用
    origin_postil_list = origin_postil_list.filter(item => {return postil_list.indexOf(common.encode(item)) === -1})
    for (const del_postil of origin_postil_list) {
        await noteService.noteTool.removePostil(del_postil, note_id)
    }
    const edit_relations = await noteService.bindTags(user_id, note_id, tag_list)
    // 删除失效的标签关联
    relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
    for (const item of relations) {
        await tagService.tagTool.unbindNote(item)
    }
    if (note.note_type === 2) {
        await tagService.tagTool.clearNoteTagNode(note_id)
        await noteService.bindStructTags(user_id, note_id, struct_list)
    }
    // 笔记本迁移，处理该笔记产生的关联引用
    if (origin_collection_id !== collection_id) {
        await noteService.noteTool.removeUnablePostil(user_id, note_id, collection_id)
        collection = await collectionService.collectionTool.get(collection_id, ['collection', 'color', 'user_id', 'hash_code'].join(','))
    }
    const tags = await tagService.tagTool.noteTags(note_id)
    const quote = await noteService.noteQuote({id: note_id})
    note = await noteService.noteTool.get(note_id)
    const data = {
        id: common.encode(note_id),
        remote_id: common.empty(note.remote_id) ? '' :common.encode(note.remote_id),
        collection_id: common.encode(collection_id),
        hash_code: note.hash_code,
        todo_id: common.encode(note.todo_id),
        is_share: 0,
        share_code: '',
        tags,
        note: content,
        quote: quote.quote,
        created_at: note.created_at,
        updated_time: note.updated_at,
        collection: {
            is_team: collection.user_id !== user_id ? 1 : 0,
            collection: common.empty(collection.collection) ? '' :collection.collection,
            color: common.empty(collection.color) ? '' :collection.color,
            hash_code: common.empty(collection.hash_code) ? '' :collection.hash_code
        },
        is_self: 1,
        note_type: note.note_type,
        url: note.url
    }
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    console.log({method: "edit", length: compare_origin_postil_list, origin_note_hash, hash_code: data.hash_code})
    if (compare_origin_postil_list.length > 0 || origin_note_hash !== data.hash_code) {
        await syncService.addNotePushQueue(user_id, note_id)
        // const params = {note_id, collection_id}
        // await syncService.syncTool.create(user_id, 21, 2, params)
    }
    return {status_code: 200, message: 'success', data}
}

/**
 * note删除
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.remove = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    note_id = common.decode(note_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可删除', data: {}}
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    await noteService.noteTool.history(note_id, 3, 3001, note.note, save_time, note.tag_json, note.struct_tag_json)
    if (note.note_type === 1) {
        await noteService.noteTool.updateNoteWeight(note_id, -1, save_time)
    }
    await noteService.noteTool.remove(note_id, save_time)
    // await noteService.noteTool.removePostil(note_id)
    await syncService.addNotePushQueue(user_id, note_id)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    // const params = {note_id, collection_id: note.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 我的笔记列表
 * @param user_id
 * @param params
 * @param trash
 * @param page
 * @param size
 * @returns {Promise<{status_code: number, data: *, message: string}>}
 */
exports.mine = async function (user_id, params, trash, page, size) {
    user_id = common.decode(user_id)
    if (params.hasOwnProperty('collection_id') && !common.empty(params.collection_id)) {
        params.collection_id = common.decode(params.collection_id)
    } else {
        params.collection_id = 0
    }
    if (params.hasOwnProperty('tag_id') && !common.empty(params.tag_id)) {
        params.tag_id = common.decode(params.tag_id)
    } else {
        params.tag_id = 0
    }
    if (params.hasOwnProperty('group_id') && !common.empty(params.group_id)) {
        params.group_id = common.decode(params.group_id)
    } else {
        params.group_id = 0
    }
    params.status = common.empty(trash) ? 1 : 0
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, params.collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: {}}
    }
    params.is_group = group_res.is_group
    const data = await noteService.userNotes(user_id, params, params.sort, page, size)
    return {status_code: 200, message: 'success', data}
}

/**
 * note详情
 * @param user_id
 * @param note_id
 * @param use_history
 * @returns {Promise<*>}
 */
exports.info = async function (user_id, note_id, use_history = 0) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '笔记ID不能为空', data: {}}
    }
    note_id = common.decode(note_id)
    const {status, message, note, history} = await noteService.info(user_id, note_id);
    if (common.empty(status)) {
        return {status_code: 400, message: message, data: {}}
    }
    if (common.empty(use_history)) {
        return {status_code: 200, message: '', data: {note, history}}
    }
    const user_right_result = await userService.userTool.userRights(user_id)
    let list = await noteService.noteTool.histories(note_id, user_right_result.user_rights.history_days, 0)
    list = list.map((item) => {
        item.id = common.encode(item.id)
        return item
    })
    const count = await noteService.noteTool.history_count(note_id, user_right_result.user_rights.history_days)
    return {status_code: 200, message: 'success', data: {note, history: {list, count}}}
}

/**
 * 合并note
 * @param user_id
 * @param target_id
 * @param source_id
 * @param tag_list
 * @param struct_list
 * @returns {Promise<*>}
 */
exports.compile = async function(user_id, target_id, source_id, tag_list = [], struct_list = []) {
    user_id = common.decode(user_id)
    if (common.empty(target_id) || common.empty(source_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    target_id = common.decode(target_id)
    source_id = common.decode(source_id)
    const target = await noteService.noteTool.get(target_id)
    const source = await noteService.noteTool.get(source_id)
    if (common.empty(target) || common.empty(source)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (target.user_id !== user_id || source.user_id !== user_id) {
        return {status_code: 400, message: '非个人笔记，无权限操作', data: {}}
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    await noteService.noteTool.history(target_id, 2, 2001, target.note, save_time, target.tag_json, target.struct_tag_json)
    await noteService.noteTool.update(target_id, target.collection_id, target.note + '<p></p>' + source.note, JSON.stringify(tag_list), JSON.stringify(struct_list), save_time, save_time)
    if (target.note_type === 1) {
        await noteService.noteTool.updateNoteWeight(target_id, 1, save_time)
    }
    let relations = await tagService.tagTool.noteTagRelations(target_id, 'id')
    relations = common.list_column(relations, 'id')
    const edit_relations = await noteService.bindTags(user_id, target_id, tag_list)
    // 删除失效的标签关联
    relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
    for (const item of relations) {
        await tagService.tagTool.unbindNote(item)
    }
    if (target.note_type === 2) {
        await tagService.tagTool.clearNoteTagNode(target_id)
        await noteService.bindStructTags(user_id, target_id, struct_list)
    }
    await noteService.mergePostil(target_id, source_id)
    // 删除源
    await noteService.noteTool.remove(source_id, save_time)
    await noteService.noteTool.removePostil(source_id)
    const info = await noteService.info(user_id, target_id);
    await syncService.addNotePushQueue(user_id, source.id)
    await syncService.addNotePushQueue(user_id, target.id)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, source)
    // let params = {note_id: source_id, collection_id: source.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, target)
    // params = {note_id: target_id, collection_id: target.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {note: info.note}}
}

/**
 * 批量处理note引用
 * @param user_id
 * @param target_id
 * @param quote
 * @returns {Promise<*>}
 */
exports.quote = async function(user_id, target_id, quote_list = []) {
    user_id = common.decode(user_id)
    target_id = common.decode(target_id)
    const note = await noteService.noteTool.get(target_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可删除', data: {}}
    }
    quote_list = common.empty(quote_list) ? [] : quote_list
    quote_list = quote_list.map((item) => {return common.decode(item)})
    const {id, quote} = await noteService.noteQuote({id: target_id})
    const quota = common.list_column(quote, 'id').map((item) => {return common.decode(item)})
    let add_list = [], del_list = []
    if (quote_list.length === 0) {
        del_list = quota
    } else if (quota.length === 0) {
        add_list = quote_list
    } else {
        add_list = quote_list.filter(item => quota.indexOf(item) === -1)
        del_list = quota.filter(item => quote_list.indexOf(item) === -1)
    }
    for (const item of add_list) {
        await noteService.noteTool.postil(item, target_id)
        const note = await noteService.noteTool.get(item)
        if (note?.note_type === 1) {
            await noteService.noteTool.updateNoteWeight(note.id, 2)
        }
    }
    for (const item of del_list) {
        await noteService.noteTool.removePostil(item, target_id)
        const note = await noteService.noteTool.get(item)
        if (note?.note_type === 1) {
            await noteService.noteTool.updateNoteWeight(note.id, -2)
        }
    }
    const info = await noteService.info(user_id, target_id);
    await syncService.addNotePushQueue(user_id, target_id)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    // const params = {note_id: target_id, collection_id: note.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {note: info.note}}
}

/**
 * 笔记历史列表
 * @param user_id
 * @param note_id
 * @param page
 * @param size
 * @returns {Promise<*>}
 */
exports.history = async function (user_id, note_id, page = 1, size = 20) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '笔记ID不能为空', data: {}}
    }
    note_id = common.decode(note_id)
    const user_right_result = await userService.userTool.userRights(user_id)
    let histories = await noteService.noteTool.histories(note_id, user_right_result.user_rights.history_days, 1, page, size)
    histories = histories.map((item) => {
        item.id = common.encode(item.id)
        return item
    })
    const count = await noteService.noteTool.history_count(note_id, user_right_result.user_rights.history_days)
    return {status_code: 200, message: 'success', data: {histories, count}}
}

/**
 * 回滚历史
 * @param user_id
 * @param history_id
 * @returns {Promise<*>}
 */
exports.roll = async function (user_id, history_id) {
    user_id = common.decode(user_id)
    if (common.empty(history_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    history_id = common.decode(history_id)
    const history = await noteService.noteTool.getHistory(history_id)
    if (common.empty(history)) {
        return {status_code: 400, message: '历史记录为空', data: {}}
    }
    if (common.empty(history.former_note)) {
        return {status_code: 400, message: '历史内容为空', data: {}}
    }
    const note = await noteService.noteTool.get(history.note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '当前记录不存在', data: {}}
    }
    let relations = await tagService.tagTool.noteTagRelations(note.id, 'id')
    relations = common.list_column(relations, 'id')
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (history.former_note !== note.note) {
        await noteService.noteTool.history(note.id, 4, 4002, note.note, save_time, note.tag_json, note.struct_tag_json)
    }
    await noteService.noteTool.update(note.id, note.collection_id, history.former_note, history.tag_list, history.struct_tag_json, save_time, save_time)
    const tag_list = common.empty(history.tag_list) ? [] : JSON.parse(history.tag_list)
    const struct_list = common.empty(history.struct_tag_json) ? [] : JSON.parse(history.struct_tag_json)
    const edit_relations = await noteService.bindTags(user_id, note.id, tag_list)
    // 删除失效的标签关联
    relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
    for (const item of relations) {
        await tagService.tagTool.unbindNote(item)
    }
    if (note.note_type === 2) {
        await tagService.tagTool.clearNoteTagNode(note.id)
        await noteService.bindStructTags(user_id, note.id, struct_list)
    }
    await syncService.addNotePushQueue(user_id, note.id)
    // await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    // const params = {note_id: note.id, collection_id: note.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 获取标签笔记数
 * @param user_id
 * @param tag_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.countByTag = async function (user_id, tag_id, collection_id) {
    user_id = common.decode(user_id)
    if (common.empty(tag_id)) {
        return {status_code: 400, message: '参数错误', data: {count: 0}}
    }
    tag_id = common.decode(tag_id)
    const params = {tag_id, status: 1, note_type: -1}
    if (!common.empty(collection_id)) {
        params['collection_id'] = common.decode(collection_id)
    }
    const count = await noteService.noteTool.count(user_id, params)
    return {status_code: 200, message: 'success', data: {count}}
}

/**
 * 转化为写作笔记
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.convertToPage = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    note_id = common.decode(note_id)
    // 权限验证
    const user_right_result = await userService.userTool.userRights(user_id)
    if (common.empty(user_right_result.is_pro)) {
        return {status_code: 401, message: '升级pro权限可切换卡片', data: {}}
    }
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可删除', data: {}}
    }
    if (note.note_type !== 1) {
        return {status_code: 400, message: '非卡片笔记不可转化', data: {}}
    }
    if (note.note_type === 2) {
        return {status_code: 400, message: '该笔记已是写作笔记', data: {}}
    }
    const tag_json = JSON.parse(note.tag_json)
    const struct_tag_json = await tagService.tagTool.convertTagToStruct(tag_json)
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    await noteService.noteTool.updateNoteType(note_id, 2, !common.empty(tag_json) ? JSON.stringify(tag_json) : '', !common.empty(struct_tag_json) ? JSON.stringify(struct_tag_json) : '', save_time)
    await noteService.noteTool.history(note_id, 2, 2001, note.note, save_time, note.tag_json, note.struct_tag_json)
    await tagService.tagTool.clearNoteTag(note_id)
    await noteService.bindStructTags(user_id, note_id, struct_tag_json)
    await syncService.addNotePushQueue(user_id, note_id)
    // const params = {note_id, collection_id: note.collection_id}
    // await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 日历笔记计数
 * @param user_id hash
 * @param note_type
 * @param collection_id
 * @param from_time 2022-07-01
 * @param end_time 2022-07-31
 * @param month 2022-07
 * @param orderby_create
 * @returns {Promise<{status_code: number, data: Array, message: string}>}
 */
exports.calendar = async function (user_id, note_type, collection_id, from_time, end_time, month, orderby_create) {
    user_id = common.decode(user_id)
    collection_id = common.decode(collection_id)
    const data = await noteService.calendarNoteCount(user_id, {note_type, collection_id, month, from_time, end_time, orderby_create})
    return {status_code: 200, message: 'success', data}
}

/**
 * 获取远程笔记id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.getRemoteId = async function (note_id) {
    note_id = common.decode(note_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const remote_id = common.empty(note.remote_id) ? '' : common.encode(note.remote_id)
    const data = {remote_id}
    return {status_code: 200, message: 'success', data}
}

/**
 * 紧急推送本地单个笔记
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.urgentPushNote = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    note_id = common.decode(note_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const user_right_result = await userService.userTool.userRights(user_id)
    if (common.empty(user_right_result.is_pro)) {
        return {status_code: 400, message: 'pro权限可以操作', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非个人笔记，无权限操作', data: {}}
    }
    await syncService.initUrgentNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
    const sync_params = {note_id: note.id, collection_id: note.collection_id, sync_urgent: 1}
    await syncService.syncTool.create(user_id, 21, 2, sync_params)
    return {status_code: 200, message: 'success', data: {}}
}
