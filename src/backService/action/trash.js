const common = require('../tool/common');
const noteService = require('../service/note');
const tagService = require('../service/tag');
const syncService = require('../service/sync')

/**
 * 恢复 note
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.restore = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    note_id = common.decode(note_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可修改', data: {}}
    }
    if (note.status !== 0) {
        return {status_code: 400, message: '无需操作', data: {}}
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    // 记录笔记历史
    await noteService.noteTool.history(note.id, 4, 4001, note.note, save_time, note.tag_json, note.struct_tag_json)
    await noteService.noteTool.restore(note.id)
    let relations = await tagService.tagTool.noteTagRelations(note.id, 'id')
    relations = common.list_column(relations, 'id')
    const tag_list = common.empty(note.note) ? [] : JSON.parse(note.tag_json)
    const struct_list = common.empty(note.note) ? [] : JSON.parse(note.struct_tag_json)
    const edit_relations = await noteService.bindTags(user_id, note_id, tag_list)
    // 删除失效的标签关联
    relations = relations.filter(item => {return edit_relations.indexOf(item) === -1})
    for (const item of relations) {
        await tagService.tagTool.unbindNote(item)
    }
    if (note.note_type === 2) {
        await tagService.tagTool.clearNoteTagNode(note.id)
        await noteService.bindStructTags(user_id, note.id, struct_list)
    }
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 强制删除
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.del = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    note_id = common.decode(note_id)
    const note = await noteService.noteTool.get(note_id)
    if (common.empty(note)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (note.status !== 0) {
        return {status_code: 400, message: '请先移入回收站', data: {}}
    }
    if (note.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可修改', data: {}}
    }
    await noteService.noteTool.delete(note_id)
    await noteService.noteTool.removePostil(note_id)
    const params = {note_id, collection_id: note.collection_id}
    await syncService.syncTool.create(user_id, 21, 2, params)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 清空回收站笔记
 * @param user_id
 * @returns {Promise<{status_code: number, data: {}, message: string}>}
 */
exports.clear = async function (user_id) {
    user_id = common.decode(user_id)
    const notes = await noteService.noteTool.userStatusNotes(user_id, [0], 'id,collection_id')
    await noteService.noteTool.clearTrash(user_id)
    if (notes.length > 0) {
        for (const note of notes) {
            await noteService.noteTool.removePostil(note.id)
            await syncService.initNoteQuoteQueue(common.encodeDesktop(user_id), '', user_id, note)
            const params = {note_id: note.id, collection_id: note.collection_id}
            await syncService.syncTool.create(user_id, 21, 2, params)
        }
    }
    return {status_code: 200, message: 'success', data: {}}
}