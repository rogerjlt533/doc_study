const common = require('../tool/common');
const tagTool = require('../tool/tag');
const collectionTool = require('../tool/collection')

exports.tagTool = tagTool

/**
 * 获取标签对应的笔记数量
 * @param user_id
 * @param tag_id
 * @param collection_id
 * @param group_id
 * @returns {Promise<*>}
 */
exports.getNoteCount = async function (user_id, tag_id, collection_id = 0, group_id = 'sum') {
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
    return await tagTool.noteCount(tag_id, collections, group_id)
}

/**
 * 标签分组格式化
 * @param tags
 * @param user_id
 * @param collection_id
 * @returns {Promise<T[]>}
 */
exports.parseGroup = async function (tags, user_id, collection_id) {
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
        unit.note_count = await tagTool.noteCount(tag_id, collections, group_tagid)
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