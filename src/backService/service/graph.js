const common = require('../tool/common');
const userTool = require('../tool/user');
const collectionTool = require('../tool/collection');
const noteTool = require('../tool/note');
const tagTool = require('../tool/tag');

exports.noteTool = noteTool

/**
 * collection权限验证
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.collectionCheck = async function (user_id, collection_id) {
    // 权限验证
    const user_right_result = await userTool.userRights(user_id)
    if (!common.empty(user_right_result.is_base)) {
        return {status_code: 401, message: '无权限', data: {}}
    }
    const collection = await collectionTool.get(collection_id, 'id,user_id,collection,color')
    if (common.empty(collection)) {
        return {status_code: 417, message: '记录不存在', data: {}}
    }
    // edu只能查看自己的
    if (!common.empty(user_right_result.is_edu) && collection.user_id !== user_id) {
        return {status_code: 400, message: '非本人记录不可操作', data: {}}
    }
    return {status_code: 200, message: '', data: {}}
}

/**
 * 标签分组
 * @param tags
 * @returns {*|*|*|*}
 */
exports.nodeGroup = function (tags) {
    tags.sort((a, b) => {
        return a - b
    })
    return this.processNodeGroup(tags)
}

/**
 * 处理标签分组
 * @param tags
 * @param result
 * @returns {*}
 */
exports.processNodeGroup = function (tags, result = []) {
    if (tags.length <= 0) {
        return result
    } else if (tags.length === 1) {
        result.push([tags[0], 0])
        return result
    } else if (tags.length === 2) {
        result.push(tags)
        return result
    }
    const first = tags[0]
    const other = tags.splice(1)
    other.forEach(function (item) {
        result.push([first, item])
    })
    return this.processNodeGroup(other, result)
}

/**
 * collection图谱
 * @param collection_id
 * @returns {Promise<{links: Array, node_list: Array, status: number}>}
 */
exports.collection = async function (collection_id) {
    let notes = await noteTool.collectionNotes(collection_id)
    if (notes.length === 0) {
        return {status: 0, node_list: [], links: []}
    }
    notes = common.list_column(notes, 'id')
    let nodes = {}
    for (const index in notes) {
        const rows = await tagTool.noteTags(notes[index])
        if (rows.length === 0) {
            continue
        }
        const tags = common.list_column(rows, 'id')
        const tags_map = common.array_map(rows, 'id', 'tag')
        const group = this.nodeGroup(tags)
        if (group.length === 0) {
            continue
        }
        for (const uindex in group) {
            const unit = group[uindex]
            let first = unit[0], second = unit[1]
            if (common.empty(first | second)) {
                continue
            }
            if (common.empty(first) || common.empty(second)) {
                first = first | second
                second = 0
            }
            if (!nodes.hasOwnProperty(first)) {
                nodes[first] = {id: first, name: tags_map[first], value: 0, list: []}
            }
            if (!common.empty(second) && !nodes.hasOwnProperty(second)) {
                nodes[second] = {id: second, name: tags_map[second], value: 0, list: []}
            }
            if (!common.empty(second) && nodes[first].list.indexOf(second) === -1) {
                nodes[first].list.push(second)
            }
        }
    }
    const group_count_list = await tagTool.collectionIndexGroupNoteCount(collection_id)
    for (const tag_id in group_count_list) {
        if (nodes.hasOwnProperty(tag_id)) {
            nodes[tag_id].value = group_count_list[tag_id]
        }
    }
    return this.parseNodes(nodes)
}

/**
 * note图谱
 * @param collection_id
 * @param note_id
 * @returns {Promise<{links: Array, node_list: Array, status: number}>}
 */
exports.note = async function (collection_id, note_id) {
    let nodes = {}
    const rows = await tagTool.noteTags(note_id)
    if (rows.length === 0) {
        return {status: 0, node_list: [], links: []}
    }
    const tags = common.list_column(rows, 'id')
    const tags_map = common.array_map(rows, 'id', 'tag')
    const group = this.nodeGroup(tags)
    if (group.length === 0) {
        return {status: 0, node_list: [], links: []}
    }
    for (const uindex in group) {
        const unit = group[uindex]
        let first = unit[0], second = unit[1]
        if (common.empty(first | second)) {
            continue
        }
        if (common.empty(first) || common.empty(second)) {
            first = first | second
            second = 0
        }
        if (!nodes.hasOwnProperty(first)) {
            nodes[first] = {id: first, name: tags_map[first], value: 0, list: []}
        }
        if (!common.empty(second) && !nodes.hasOwnProperty(second)) {
            nodes[second] = {id: second, name: tags_map[second], value: 0, list: []}
        }
        if (!common.empty(second) && nodes[first].list.indexOf(second) === -1) {
            nodes[first].list.push(second)
        }
    }
    const group_count_list = await tagTool.noteIndexGroupCount(collection_id, note_id)
    for (const tag_id in group_count_list) {
        if (nodes.hasOwnProperty(tag_id)) {
            nodes[tag_id].value = group_count_list[tag_id]
        }
    }
    return this.parseNodes(nodes)
}

/**
 * 格式化节点
 * @param nodes
 * @returns {{links: (Array), node_list: Array, status: number}}
 */
exports.parseNodes = function (nodes) {
    let node_list = [], links = []
    nodes = Object.values(nodes)
    nodes.map((item) => {
        const list = item.list
        delete item['list']
        if (!common.empty(list)) {
            list.forEach(function (target) {
                links.push({source: common.encode(item.id), target: common.encode(target)})
            })
        } else {
            links.push({source: common.encode(item.id), target: common.encode(0)})
        }
        item.id = common.encode(item.id)
        node_list.push(item)
    })
    return {status: 1, node_list, links}
}
