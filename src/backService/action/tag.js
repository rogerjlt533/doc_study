const common = require('../tool/common');
const tagService = require('../service/tag');
const collectionService = require('../service/collection');
const userService = require('../service/user');

/**
 * 标签列表
 * @param user_id
 * @param collection_id
 * @param note_type
 * @returns {Promise<*>}
 */
exports.list = async function (user_id, collection_id, note_type = 0) {
    user_id = common.decode(user_id)
    if (!common.empty(collection_id)) {
        collection_id = common.decode(collection_id)
    } else {
        collection_id = 0
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: []}
    }
    const tags = await tagService.tagTool.tags(user_id, collection_id, group_res.is_group, '', note_type)
    if (common.empty(tags)) {
        return {status_code: 200, message: 'success', data: []}
    }
    for (const index in tags) {
        tags[index].note_count = await tagService.getNoteCount(user_id, tags[index].id, collection_id)
        tags[index].id = common.encode(tags[index].id)
    }
    tags.sort((a, b) => {
        return b.note_count - a.note_count
    })
    return {status_code: 200, message: 'success', data: tags}
}

/**
 * 分组标签列表
 * @param user_id
 * @param collection_id
 * @param keyword
 * @param note_type
 * @returns {Promise<*>}
 */
exports.group = async function (user_id, collection_id, keyword = '', note_type = 0) {
    user_id = common.decode(user_id)
    if (!common.empty(collection_id)) {
        collection_id = common.decode(collection_id)
    } else {
        collection_id = 0
    }
    if (!common.empty(keyword)) {
        keyword = keyword.trim()
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: []}
    }
    const tags = await tagService.tagTool.tags(user_id, collection_id, group_res.is_group, keyword, note_type)
    if (common.empty(tags)) {
        return {status_code: 200, message: 'success', data: []}
    }
    for (const index in tags) {
        tags[index].group_id = ''
        tags[index].note_count = await tagService.getNoteCount(user_id, tags[index].id, collection_id, note_type)
    }
    tags.sort((a, b) => {
        return b.note_count - a.note_count
    })
    const data = await tagService.parseGroup(tags, user_id, collection_id)
    return {status_code: 200, message: 'success', data}
}

/**
 * 声母标签分组
 * @param user_id
 * @param collection_id
 * @param keyword
 * @param note_type
 * @returns {Promise<*>}
 */
exports.groupInitial = async function (user_id, collection_id, keyword = '', note_type = 0) {
    user_id = common.decode(user_id)
    if (!common.empty(collection_id)) {
        collection_id = common.decode(collection_id)
    } else {
        collection_id = 0
    }
    if (!common.empty(keyword)) {
        keyword = keyword.trim()
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: []}
    }
    const tags = await tagService.tagTool.tags(user_id, collection_id, group_res.is_group, keyword, note_type)
    if (common.empty(tags)) {
        return {status_code: 200, message: 'success', data: []}
    }
    const available_list = []
    for (const item of tags) {
        const group_id = '', id = item.id, is_top = item.is_top, tag = item.tag
        const note_count = await tagService.getNoteCount(user_id, item.id, collection_id, note_type)
        available_list.push({ group_id, id, is_top, note_count, tag })
    }
    tags.sort((a, b) => {
        return b.note_count - a.note_count
    })
    const data = await tagService.parseGroupByInitial(available_list, user_id, collection_id, note_type)
    return {status_code: 200, message: 'success', data}
}

/**
 * 声母标签分组
 * @param user_id
 * @param collection_id
 * @param keyword
 * @param note_type
 * @returns {Promise<*>}
 */
exports.groupTrashInitial = async function (user_id, collection_id, keyword = '', note_type = 0) {
    user_id = common.decode(user_id)
    if (!common.empty(collection_id)) {
        collection_id = common.decode(collection_id)
    } else {
        collection_id = 0
    }
    if (!common.empty(keyword)) {
        keyword = keyword.trim()
    }
    const group_res = await collectionService.collectionTool.getIsGroup(user_id, collection_id)
    if (!group_res.status) {
        return {status_code: 400, message: group_res.message, data: []}
    }
    const tags = await tagService.tagTool.tags(user_id, collection_id, group_res.is_group, keyword, note_type)
    if (common.empty(tags)) {
        return {status_code: 200, message: 'success', data: []}
    }
    const available_list = []
    for (const item of tags) {
        const group_id = '', id = item.id, is_top = item.is_top, tag = item.tag
        const note_count = await tagService.getTrashNoteCount(user_id, item.id, collection_id, note_type)
        available_list.push({ group_id, id, is_top, note_count, tag })
    }
    tags.sort((a, b) => {
        return b.note_count - a.note_count
    })
    const data = await tagService.parseTrashGroupByInitial(available_list, user_id, collection_id, note_type)
    return {status_code: 200, message: 'success', data}
}

/**
 * 解除标签置顶
 * @param user_id
 * @param tag_id
 * @returns {Promise<*>}
 */
exports.normal = async function (user_id, tag_id) {
    user_id = common.decode(user_id)
    tag_id = common.decode(tag_id)
    const res = await tagService.tagTool.setTopStatus(tag_id, 0)
    if (res) {
        await tagService.uploadTagTop(user_id, tag_id, 0)
        return {status_code: 200, message: 'success', data: {}}
    }
    return {status_code: 400, message: '解除失败', data: {}}
}

/**
 * 设置标签置顶
 * @param user_id
 * @param tag_id
 * @returns {Promise<*>}
 */
exports.top = async function (user_id, tag_id) {
    user_id = common.decode(user_id)
    tag_id = common.decode(tag_id)
    const res = await tagService.tagTool.setTopStatus(tag_id, 1)
    if (res) {
        await tagService.uploadTagTop(user_id, tag_id, 1)
        return {status_code: 200, message: 'success', data: {}}
    }
    return {status_code: 400, message: '操作失败', data: {}}
}

/**
 * 追加标签
 * @param user_id
 * @param tag_list
 * @returns {Promise<{status_code: number, data: Array, message: string}>}
 */
exports.append = async function (user_id, tag_list = []) {
    user_id = common.decode(user_id)
    tag_list = common.empty(tag_list) ? [] : tag_list
    const data = []
    for (const tag of tag_list) {
        if (common.empty(tag)) {
            continue
        }
        const record = await tagService.tagTool.findByTag(user_id, tag)
        if (common.empty(record)) {
            const tag_id = await tagService.tagTool.create(user_id, tag)
            data.push({id: common.encode(tag_id), tag})
        } else {
            data.push({id: common.encode(record.id), tag})
        }
    }
    return {status_code: 200, message: 'success', data}
}

/**
 * 更新标签声母，填充空声母
 * 启动调用一次
 * @returns {Promise<*>}
 */
exports.fillTagInitial = async function () {
    const tags = await tagService.tagTool.emptyInitialTags()
    if (common.empty(tags)) {
        return {status_code: 200, message: 'success', data: []}
    }
    for (const index in tags) {
        const initial = common.initial(tags[index].tag)
        await tagService.tagTool.setInitial(tags[index].id, initial)
    }
    return {status_code: 200, message: 'success', data: tags}
}