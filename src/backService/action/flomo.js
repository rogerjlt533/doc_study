const common = require('../tool/common')
const flomoTool = require('../tool/flomo')
const noteService = require('../service/note')
const collectionService = require('../service/collection')
const userService = require('../service/user')
const syncService = require('../service/sync')

/**
 * 导入flomo
 * @param user_id
 * @param source
 * @param dest
 * @returns {Promise<{status_code: number, data: {}, message: string}>}
 */
exports.import = async function (user_id, source, dest) {
    user_id = common.decode(user_id)
    common.unzip(source, dest)
    const memos = await flomoTool.importFiles(dest)
    const hash_list = []
    for (const memo of memos) {
        if (!memo.status) {
            continue
        }
        await noteService.importFlomo(user_id, memo)
        if (hash_list.indexOf(memo.hash) !== -1) {
            continue
        }
        const note = await noteService.noteTool.getHashNote(memo.hash)
        if (!common.empty(note)) {
            continue
        }
        const user_setting = await userService.userTool.setting(user_id)
        const collection_id = common.empty(user_setting) ? 0 : user_setting.default
        if (common.empty(collection_id) || common.empty(memo.content)) {
            continue
        }
        const collection = await collectionService.collectionTool.get(collection_id, ['collection', 'color', 'user_id', 'hash_code'].join(','))
        if (common.empty(collection)) {
            return {status_code: 400, message: '笔记本不存在', data: {}}
        }
        const struct_list = []
        const note_id = await noteService.noteTool.create(user_id, collection_id, 1, 'flomo', memo.content, '', JSON.stringify(memo.tag_list), JSON.stringify(struct_list), memo.time)
        if (common.empty(note_id)) {
            common.unlink(source)
            common.rmdir(dest)
            return {status_code: 500, message: '记录创建失败', data: {}}
        }
        hash_list.push(memo.hash)
        await noteService.bindTags(user_id, note_id, memo.tag_list)
        const params = {note_id, collection_id}
        await syncService.syncTool.create(user_id, 21, 2, params)
    }
    common.unlink(source)
    common.rmdir(dest)
    return {status_code: 200, message: 'success', data: {}}
}