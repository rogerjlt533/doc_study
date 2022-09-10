const common = require('../tool/common');
const graphService = require('../service/graph')

/**
 * collection图谱
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.collection = async function (user_id, collection_id) {
    user_id = common.decode(user_id)
    if (common.empty(collection_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    collection_id = common.decode(collection_id)
    const check_result = await graphService.collectionCheck(user_id, collection_id)
    if (check_result.status_code !== 200) {
        return check_result
    }
    const {status, node_list, links} = await graphService.collection(collection_id)
    if (status === 0) {
        return {status_code: 400, message: '无记录', data: {node_list, links}}
    }
    return {status_code: 200, message: 'success', data: {node_list, links}}
}

/**
 * 笔记直系图谱
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.note = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    note_id = common.decode(note_id)
    const note = await graphService.noteTool.get(note_id, 'id,user_id,collection_id')
    if (common.empty(note)) {
        return {status_code: 400, message: '笔记不存在', data: {}}
    }
    const collection_id = note.collection_id
    const check_result = await graphService.collectionCheck(user_id, collection_id)
    if (check_result.status_code !== 200) {
        return check_result
    }
    const {status, node_list, links} = await graphService.note(collection_id, note_id)
    if (status === 0) {
        return {status_code: 400, message: '无记录', data: {node_list, links}}
    }
    return {status_code: 200, message: 'success', data: {node_list, links}}
}

/**
 * 结构化图谱
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.structure = async function (user_id, note_id) {
    user_id = common.decode(user_id)
    if (common.empty(note_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    note_id = common.decode(note_id)
    const note = await graphService.noteTool.get(note_id, 'id,user_id,collection_id,note_type,struct_tag_json')
    if (common.empty(note)) {
        return {status_code: 400, message: '笔记不存在', data: {}}
    }
    const collection_id = note.collection_id
    const check_result = await graphService.collectionCheck(user_id, collection_id)
    if (check_result.status_code !== 200) {
        return check_result
    }
    if (note.note_type !== 2) {
        return {status_code: 400, message: '非笔记,不可生成图谱', data: {}}
    }
    if (common.empty(note.struct_tag_json)) {
        return {status_code: 200, message: 'success', data: {list: []}}
    }
    return {status_code: 200, message: 'success', data: {list: JSON.parse(note.struct_tag_json)}}
}