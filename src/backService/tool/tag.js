const sqlite = require('./sqlitepool');
const common = require('./common');
const sd = require('silly-datetime');

/**
 * 创建标签
 * @param user_id
 * @param tag_name
 * @returns {Promise<any>}
 */
exports.create = async function (user_id, tag_name) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const initial = common.initial(tag_name)
    const sql = "INSERT INTO tags(user_id, tag, initial, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [user_id, tag_name, initial, save_time, save_time])
}

/**
 * 根据标签名获取对应标签记录
 * @param user_id
 * @param tag
 * @returns {Promise<any>}
 */
exports.findByTag = async function (user_id, tag) {
    const sql = "SELECT * FROM tags WHERE tag=? and user_id=? and deleted_at is null"
    return await sqlite.get(sql, [tag, user_id])
}

/**
 * 修改声母
 * @param tag_id
 * @param initial
 * @returns {Promise<boolean>}
 */
exports.setInitial = async function (tag_id, initial) {
    if (common.empty(tag_id)) {
        return false
    }
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE tags SET initial=?, updated_at=? WHERE id=? and deleted_at is null"
    const res = await sqlite.update(sql, [initial, save_time, tag_id])
    return res > 0 ? true : false
}

/**
 * 空声母标签
 * @param columns
 * @returns {Promise<void>}
 */
exports.emptyInitialTags = async function (columns = ['id', 'tag']) {
    columns = columns.join(',')
    const options = []
    let sql = "select #COLUMNS# from tags where initial is null OR LENGTH(initial)=0"
    sql = sql.replace('#COLUMNS#', columns)
    return await sqlite.all(sql, options)
}

/**
 * 设置置顶状态
 * @param tag_id
 * @param status
 * @returns {Promise<boolean>}
 */
exports.setTopStatus = async function (tag_id, status) {
    if (common.empty(tag_id)) {
        return false
    }
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE tags SET is_top=?, updated_at=? WHERE id=? and deleted_at is null"
    const res = await sqlite.update(sql, [status, save_time, tag_id])
    return res > 0 ? true : false
}

/**
 * 获取笔记标签记录列表
 * @param note_id
 * @returns {Promise<Array>}
 */
exports.noteRelations = async function (note_id) {
    const sql = "select note_tag_relation.* from note_tag_relation" +
        " left join tags on tags.id=note_tag_relation.tag_id" +
        " where note_tag_relation.note_id=? and note_tag_relation.deleted_at is null and tags.deleted_at is null"
    const rows = await sqlite.all(sql, [note_id])
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 获取标签列表
 * @param user_id
 * @param collection_id
 * @param is_group
 * @param keyword
 * @param note_type
 * @param columns
 * @returns {Promise<any>}
 */
exports.tags = async function (user_id, collection_id, is_group, keyword, note_type = 0, columns = ['tags.id', 'tags.tag', 'tags.is_top']) {
    columns = columns.join(',')
    const condition = [], options = []
    let sql = "select DISTINCT #COLUMNS# from tags" +
        " left join note_tag_relation on tags.id=note_tag_relation.tag_id" +
        " left join notes on notes.id=note_tag_relation.note_id" +
        " left join collections on collections.id=notes.collection_id" +
        " where #CONDITION#"
    condition.push('notes.status=1')
    if (!common.empty(collection_id)) {
        condition.push('notes.collection_id=?')
        options.push(collection_id)
    }
    if (!common.empty(keyword)) {
        condition.push("tags.tag like '%" + keyword + "%'")
    }
    if (is_group === 1) {
        condition.push('tags.user_id=?')
        options.push(user_id)
    }
    if (!common.empty(note_type) && note_type > 0) {
        condition.push('notes.note_type=?')
        options.push(note_type)
    }
    condition.push('notes.deleted_at is null and collections.deleted_at is null')
    sql = sql.replace('#COLUMNS#', columns)
    sql = sql.replace('#CONDITION#', condition.join(' and '))
    return await sqlite.all(sql, options)
}

/**
 * note标签列表
 * @param note_id
 * @returns {Promise<Array>}
 */
exports.noteTags = async function (note_id) {
    let sql = "select DISTINCT tags.id, tags.tag from note_tag_relation" +
        " left join tags on tags.id=note_tag_relation.tag_id" +
        " where note_tag_relation.note_id=? and note_tag_relation.deleted_at is null and tags.deleted_at is null"
    const rows = await sqlite.all(sql, [note_id])
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 标签对应的笔记数
 * @param tag_id
 * @param collections
 * @param group_id
 * @returns {Promise<*>}
 */
exports.noteCount = async function (tag_id, collections = [], group_id = 'sum') {
    if (common.empty(tag_id)) {
        return 0
    }
    const condition = [], options = []
    let sql = "select COUNT(DISTINCT notes.id) AS ts_count from tags" +
        " left join note_tag_relation on tags.id=note_tag_relation.tag_id" +
        " left join notes on notes.id=note_tag_relation.note_id" +
        " left join collections on collections.id=notes.collection_id" +
        " where #CONDITION#"
    condition.push('notes.status=?', 'tags.id=?')
    options.push(1, tag_id)
    if (collections.length > 0) {
        condition.push('notes.collection_id in (' +  collections.join(',') + ')')
    }
    if (group_id !== 'sum') {
        condition.push('note_tag_relation.group_id=?')
        options.push(group_id)
    }
    condition.push('notes.deleted_at is null and collections.deleted_at is null')
    sql = sql.replace('#CONDITION#', condition.join(' and '))
    const row = await sqlite.get(sql, options)
    if (common.empty(row)) {
        return 0
    } else if (common.empty(row.ts_count)) {
        return 0
    }
    return row.ts_count
}

/**
 * collection 笔记计数键值对数组
 * @param collection_id
 * @returns {Promise<{}>}
 */
exports.collectionIndexGroupNoteCount = async function(collection_id) {
    if (common.empty(collection_id)) {
        return {}
    }
    let sql = "select note_tag_relation.tag_id, count(distinct notes.id) as ts_count from note_tag_relation" +
        " left join notes on note_tag_relation.note_id=notes.id" +
        " where notes.collection_id=? and notes.status=1" +
        " and notes.deleted_at is null and note_tag_relation.deleted_at is null" +
        " group by note_tag_relation.tag_id"
    const rows = await sqlite.all(sql, [collection_id])
    if (common.empty(rows)) {
        return {}
    }
    return common.array_map(rows, 'tag_id', 'ts_count')
}

/**
 * note 笔记计数键值对数组
 * @param collection_id
 * @param note_id
 * @returns {Promise<{}>}
 */
exports.noteIndexGroupCount = async function(collection_id, note_id) {
    if (common.empty(collection_id) || common.empty(note_id)) {
        return {}
    }
    const note_tags = await this.noteTags(note_id)
    if (note_tags.length === 0) {
        return {}
    }
    let sql = "select note_tag_relation.tag_id, count(distinct notes.id) as ts_count from note_tag_relation" +
        " left join notes on note_tag_relation.note_id=notes.id" +
        " where notes.collection_id=? and notes.status=1 and #TAGS#" +
        " and notes.deleted_at is null and note_tag_relation.deleted_at is null" +
        " group by note_tag_relation.tag_id"
    sql = sql.replace('#TAGS#', 'note_tag_relation.tag_id in (' + common.array_column(note_tags, 'id').join(',') + ')')
    const rows = await sqlite.all(sql, [collection_id])
    if (common.empty(rows)) {
        return {}
    }
    return common.array_map(rows, 'tag_id', 'ts_count')
}

/**
 * 标签分组明细
 * @param tagid_list
 * @returns {Promise<Array>}
 */
exports.groupItems = async function (tagid_list) {
    let sql = "select tag_group.tag_id as group_tagid,tag_group_items.tag_id,tag_group.group_name from tag_group_items" +
        " left join tag_group on tag_group_items.group_id=tag_group.id where #CONDITIONS#"
    let conditions = ['tag_group.deleted_at is null', 'tag_group_items.deleted_at is null']
    conditions.push('tag_group_items.tag_id in (' + tagid_list.join(',') + ')')
    sql = sql.replace('#CONDITIONS#', conditions.join(' and '))
    const rows = await sqlite.all(sql)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 获取笔记标签关联
 * @param note_id
 * @param tag_id
 * @param group_id
 * @returns {Promise<any>}
 */
exports.findNoteRelation = async function (note_id, tag_id, group_id) {
    const sql = "SELECT * FROM note_tag_relation WHERE note_id=? and tag_id=? and group_id=? and deleted_at is null"
    return await sqlite.get(sql, [note_id, tag_id, group_id])
}

/**
 * 笔记关联
 * @param note_id
 * @param columns
 * @returns {Promise<Array>}
 */
exports.noteTagRelations = async function (note_id, columns = 'id,note_id,tag_id,group_id') {
    const sql = "SELECT #COLUMNS# FROM note_tag_relation WHERE note_id=? and deleted_at is null".replace('#COLUMNS#', columns)
    const list = await sqlite.all(sql, [note_id])
    if (common.empty(list)) {
        return []
    }
    return list
}

/**
 * 标签绑定笔记
 * @param note_id
 * @param tag_id
 * @param group_id
 * @returns {Promise<*>}
 */
exports.bindNote = async function (note_id, tag_id, group_id) {
    group_id = common.empty(group_id) ? 0 : group_id
    const relate = await this.findNoteRelation(note_id, tag_id, group_id)
    if (!common.empty(relate)) {
        return relate.id
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const insertSql = "INSERT INTO note_tag_relation(note_id, tag_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    return await sqlite.insert(insertSql, [note_id, tag_id, group_id, save_time, save_time])
}

/**
 * 标签解除绑定
 * @param relation_id
 * @returns {Promise<any>}
 */
exports.unbindNote = async function (relation_id) {
    return await sqlite.delete("note_tag_relation", "id=" + relation_id)
}

/**
 * json转list
 * @param json
 * @param list
 * @returns {Array}
 */
exports.json2List = function (json, list = []) {
    list = common.empty(list) ? [] : list
    if (common.empty(json)) {
        return list
    }
    const type = json.type
    if (type === 'text') {
        common.list_column(json.text.concat(" ").matchAll(/\#(\S+?)?\s{1}/g), 1).forEach(function (item) {
            if (!common.empty(item)) {
                item = item.replace("-", '/')
                if (list.indexOf(item) === -1) {
                    list.push(item)
                }
            }
        })
        return list
    }
    if (!common.empty(json.content)) {
        for (const item of json.content) {
            list = this.json2List(item, list)
        }
    }
    return list
}

/**
 * json转大纲
 * @param json
 * @param level
 * @param list
 * @param tags
 * @param keys
 */
exports.json2Tree = function (json, level = 0, list = {}, tags = [], keys = []) {
    list = common.empty(list) ? {} : list
    tags = common.empty(tags) ? [] : tags
    keys = common.empty(keys) ? [] : keys
    if (common.empty(json)) {
        return {list, tags}
    }
    if (json.type === 'text') {
        // 文本直接处理不越级
        common.list_column(json.text.concat(" ").matchAll(/\#(\S+?)?\s{1}/g), 1).forEach(function (item) {
            if (!common.empty(item)) {
                item = item.replace("-", '/')
                const items = item.split('/')
                for (const value of items) {
                    if (tags.indexOf(value) === -1) {
                        tags.push(value)
                    }
                    const tagIndex = tags.indexOf(value)
                    if (level === 0) {
                        if (!list.hasOwnProperty(-1)) {
                            list[-1] = {tag: '', level: 0, data: {}}
                        }
                        list[-1].data[tagIndex] = {tag: value, level: 0, data: {}}
                    } else {
                        keys = keys.slice(0, level)
                        keys.push(tagIndex)
                        if (!common.array_exists(list, keys.join('.data.'))) {
                            common.array_set(list, keys.join('.data.'), {tag: value, level: 0, data: {}})
                        }
                    }
                }
            }
        })
        return {list, tags, keys}
    }
    if (!common.empty(json.content)) {
        for (const index in json.content) {
            const item = json.content[index]
            if (item.type === 'heading') {
                level = item.attrs.level
                const value = item.content[0].text
                if (tags.indexOf(value) === -1) {
                    tags.push(value)
                }
                const tagIndex = tags.indexOf(value)
                keys = keys.slice(0, level - 1)
                keys.push(tagIndex)
                if (!common.array_exists(list, keys.join('.data.'))) {
                    common.array_set(list, keys.join('.data.'), {tag: value, level: level, data: {}})
                }
            } else if (!common.empty(item.content)) {
                for (const unit of item.content) {
                    const tree_result = this.json2Tree(unit, level, list, tags, keys)
                    list = tree_result.list
                    tags = tree_result.tags
                    keys = tree_result.keys
                }
            }
        }
    }
    return {list, tags, keys}
}

/**
 * 过滤树键名
 * @param list
 * @param result
 * @returns {Array}
 */
exports.filterTreeKey = function (list, result = []) {
    result = common.empty(result) ? [] : result
    for (const index in list) {
        if (list[index].data.size === 0) {
            result.push(list[index]);
            continue
        }
        const arr = this.filterTreeKey(this.filterTreeKey(list[index].data))
        list[index].data = arr
        result.push(list[index]);
    }
    return result
}

/**
 * 依据标签获取标签分组记录
 * @param user_id
 * @param tag_id
 * @returns {Promise<any>}
 */
exports.findGroupByTag = async function (user_id, tag_id) {
    const sql = "SELECT * FROM tag_group WHERE tag_id=? and  user_id=? and deleted_at is null"
    return await sqlite.get(sql, [tag_id, user_id])
}

/**
 * 创建分组
 * @param user_id
 * @param group_name
 * @returns {Promise<*>}
 */
exports.createGroup = async function (user_id, group_name) {
    let tag_id = 0
    const tag = await this.findByTag(user_id, group_name)
    if (!common.empty(tag)) {
        tag_id = tag.id
    } else {
        tag_id = await this.create(user_id, group_name)
    }
    if (common.empty(tag_id)) {
        return {group_id: 0, tag_id: 0}
    }
    const tag_group = await this.findGroupByTag(user_id, tag_id)
    if (!common.empty(tag_group)) {
        return {group_id: tag_group.id, tag_id: tag_group.tag_id}
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "INSERT INTO tag_group(user_id, group_name, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    const group_id = await sqlite.insert(sql, [user_id, group_name, tag_id, save_time, save_time]);
    return {group_id: group_id, tag_id: tag_id}
}

/**
 * 获取分组明细
 * @param user_id
 * @param group_id
 * @param tag_id
 * @returns {Promise<any>}
 */
exports.findGroupItem = async function (user_id, group_id, tag_id) {
    const sql = "SELECT * FROM tag_group_items WHERE user_id=? and group_id=? and tag_id=? and deleted_at is null"
    return await sqlite.get(sql, [user_id, group_id, tag_id])
}

/**
 * 添加分组明细
 * @param user_id
 * @param group_id
 * @param tag_id
 * @returns {Promise<*>}
 */
exports.initGroupItem = async function (user_id, group_id, tag_id) {
    if (common.empty(group_id) || common.empty(tag_id)) {
        return 0
    }
    const item = await this.findGroupItem(user_id, group_id, tag_id)
    if (!common.empty(item)) {
        return item.id
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "INSERT INTO tag_group_items(user_id, group_id, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [user_id, group_id, tag_id, save_time, save_time]);
}

/**
 * 清空笔记相关结构化标签
 * @param note_id
 * @returns {Promise<void>}
 */
exports.clearNoteTagNode = async function (note_id) {
    await sqlite.delete('note_tag_nodes', 'note_id=' + note_id)
    await sqlite.delete('note_tag_node_items', 'note_id=' + note_id)
}

/**
 * 创建笔记相关结构化标签节点
 * @param note_id
 * @param tag
 * @param is_header
 * @param parent_node
 * @param sort_index
 * @param save_time
 * @param remote_id
 * @returns {Promise<*>}
 */
exports.addNoteTagNode = async function (note_id, tag, is_header, parent_node, sort_index, save_time, remote_id = 0) {
    const sql = "INSERT INTO note_tag_nodes(note_id, tag, is_header, parent_node, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [note_id, tag, is_header, parent_node, sort_index, save_time, save_time]);
}

/**
 * 创建笔记相关结构化标签节点明细
 * @param note_id
 * @param node_id
 * @param tag_id
 * @param sort_index
 * @param save_time
 * @param remote_id
 * @returns {Promise<*>}
 */
exports.addNoteTagNodeItem = async function (note_id, node_id, tag_id, sort_index, save_time, remote_id = 0) {
    const sql = "INSERT INTO note_tag_node_items(note_id, node_id, tag_id, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [note_id, node_id, tag_id, sort_index, save_time, save_time]);
}

/**
 * 过滤树键名
 * @param list
 * @param result
 * @returns {Array}
 */
// exports.initTreeTagCount = function (list, result = []) {
//     result = common.empty(result) ? [] : result
//     for (const index in list) {
//         if (list[index].data.size === 0) {
//             result.push(list[index]);
//             continue
//         }
//         const arr = this.filterTreeKey(this.filterTreeKey(list[index].data))
//         list[index].data = arr
//         result.push(list[index]);
//     }
//     return result
// }

/**
 *
 * @param tag
 * @returns {{tag_content: string, tag_name: *}}
 */
exports.formatTagContent = function (tag) {
    const result = {tag_name: tag, tag_value: '', single: '', group: '', children: [], tag_content: ''}
    tag = tag.replace(/-/g, '/')
    tag = tag.replace(/^\//, '')
    tag = tag.replace(/\/$/, '')
    tag = tag.replace(/(\/{2,})/g, '/')
    const tags = tag.split('/')
    if (tags.length === 1) {
        result.single = tag
        result.tag_value = tag
        result.tag_content = '<span data-type="mention" class="hashtag-suggestion" data-id="' + tag + '">#' + tag +' </span>'
    } else {
        const contents = [], values = []
        for (const index in tags) {
            let value = tags[index].trim()
            if (common.empty(value)) {
                continue
            }
            contents.push('<span data-type="mention" class="hashtag-suggestion" data-id="' + value + '">#' + value +' </span>')
            values.push(value)
            if (index == 0) {
                result.group = value
            } else {
                result.children.push(value)
            }
            result.tag_content = contents.join('/')
        }
        result.tag_value = values.join('/')
    }
    return result
}