const common = require('../tool/common');
const tagTool = require('../tool/tag');
const syncTool = require('../tool/sync');
const collectionTool = require('../tool/collection')

exports.tagTool = tagTool

/**
 * 获取标签对应的笔记数量
 * @param user_id
 * @param tag_id
 * @param collection_id
 * @param note_type
 * @param group_id
 * @returns {Promise<*>}
 */
exports.getNoteCount = async function (user_id, tag_id, collection_id = 0, note_type = 0, group_id = 'sum') {
    if (common.empty(user_id)) {
        return 0
    }
    group_id = common.empty(group_id) ? 0 : group_id;
    let collections = []
    if (!common.empty(collection_id)) {
        collections.push(collection_id)
    } else {
        const joined_list = await collectionTool.joinedList(user_id, 'collection_id')
        if (!common.empty(joined_list)) {
            collections = common.list_column(joined_list, 'collection_id')
        }
    }
    // console.log(collections)

    if (collections.length === 0) {
        return 0
    }
    return await tagTool.noteCount(tag_id, collections, note_type, group_id)
}

/**
 * 标签分组格式化
 * @param tags
 * @param user_id
 * @param collection_id
 * @param note_type
 * @returns {Promise<T[]>}
 */
exports.parseGroup = async function (tags, user_id, collection_id, note_type = 0) {
    let list = {}, groups = {}
    tags.forEach(function (item) {
        const tag_id = item.id
        list[tag_id] = item
        list[tag_id]['id'] = common.encode(item.id)
        list[tag_id]['allow_search'] = 1
    })
    groups[0] = {name: '默认', group_id: '', allow_search: 0, list: Object.values(list)}
    let tagid_list = common.list_column(tags, 'id')
    tagid_list = tagid_list.map(item => common.decode(item))
    const rows = await tagTool.groupItems(tagid_list)
    for (const index in rows) {
        const row = rows[index]
        const group_tagid = row.group_tagid
        const tag_id = row.tag_id
        const name = row.group_name
        if (!groups.hasOwnProperty(group_tagid)) {
            groups[group_tagid] = {name, allow_search: 1, group_id: common.encode(group_tagid), list: []}
        }
        const unit = list[tag_id]
        const collections = common.empty(collection_id) ? [] : [collection_id]
        unit.note_count = await tagTool.noteCount(tag_id, collections, note_type, group_tagid)
        unit.group_id = common.encode(group_tagid)
        groups[group_tagid].list.push(unit)
    }
    for (const key in groups) {
        const group = groups[key]
        let total = common.array_sum(group.list, 'note_count')
        if (total > 0) {
            continue
        }
        delete(groups[key])
    }

    return Object.values(groups)
}

/**
 * 声母分组格式化
 * @param tags
 * @param user_id
 * @param collection_id
 * @param note_type
 * @returns {Promise<Array>}
 */
exports.parseGroupByInitial = async function (tags, user_id, collection_id, note_type = 0) {
    let list = {}, default_list = {}, groups = {}, sub_groups = {}, out_groups = []
    tags.forEach(function (item) {
        const tag_id = item.id
        list[tag_id] = item
        list[tag_id]['id'] = common.encode(item.id)
        list[tag_id]['allow_search'] = 1
        if (item.note_count > 0) {
            // 默认列表
            const initial_tag = common.initial(item.tag)
            if (!default_list.hasOwnProperty(initial_tag)) {
                default_list[initial_tag] = {name: initial_tag, is_default: 1, list: []}
            }
            default_list[initial_tag].list.push(item)
        }
    })
    default_list = Object.values(default_list)
    default_list.sort((a, b) => {
        return a.name.charCodeAt(0) - b.name.charCodeAt(0)
    })
    for (const default_item of default_list) {
        out_groups.push(default_item)
    }
    let tagid_list = common.list_column(tags, 'id')
    tagid_list = tagid_list.map(item => common.decode(item))
    const rows = await tagTool.groupItems(tagid_list)
    for (const index in rows) {
        const row = rows[index]
        const group_tagid = row.group_tagid
        const tag_id = row.tag_id
        const name = row.group_name
        if (!groups.hasOwnProperty(group_tagid)) {
            groups[group_tagid] = {name, allow_search: 1, group_id: common.encode(group_tagid), list: []}
        }
        const unit = list[tag_id]
        const collections = common.empty(collection_id) ? [] : [collection_id]
        unit.note_count = await tagTool.noteCount(tag_id, collections, note_type, group_tagid)
        unit.group_id = common.encode(group_tagid)
        groups[group_tagid].list.push(unit)
    }
    for (const key in groups) {
        const group = groups[key]
        let total = common.array_sum(group.list, 'note_count')
        if (total <= 0) {
            continue
        }
        const initial_name = common.initial(group.name)
        if (!sub_groups.hasOwnProperty(initial_name)) {
            sub_groups[initial_name] = {name: initial_name, is_default: 0, list: []}
        }
        sub_groups[initial_name].list.push(group)
    }
    sub_groups = Object.values(sub_groups)
    sub_groups.sort((a, b) => {
        return a.name.charCodeAt(0) - b.name.charCodeAt(0)
    })
    for (const sub_item of sub_groups) {
        out_groups.push(sub_item)
    }
    return out_groups
}

/**
 * 上传标签置顶状态
 * @param user_id
 * @param tag_id
 * @param is_top
 * @returns {Promise<void>}
 */
exports.uploadTagTop = async function (user_id, tag_id, is_top) {
    const params = {tag_id, note_status: is_top}
    await syncTool.create(user_id, 31, 2, params)
}