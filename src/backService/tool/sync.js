const sqlite = require('./syncsqlitetool');
const common = require('./common');

/**
 * 获取同步记录
 * @param id
 * @returns {Promise<any>}
 */
exports.get = async function (id) {
    const sql = 'select * from syncs where id=?'
    return await sqlite.get(sql, [id]);
}

/**
 * 获取collection同步记录
 * @param user_id
 * @param collection_id
 * @param type
 * @param direct
 * @returns {Promise<any>}
 */
exports.collection = async function (user_id, collection_id, type, direct) {
    const sql = 'select * from syncs where user_id=? and collection_id=? and sync_type=? and sync_direct=?'
    return await sqlite.get(sql, [user_id, collection_id, type, direct]);
}

/**
 * 获取note同步记录
 * @param user_id
 * @param note_id
 * @param type
 * @param direct
 * @returns {Promise<any>}
 */
exports.note = async function (user_id, note_id, type, direct) {
    const sql = 'select * from syncs where user_id=? and note_id=? and sync_type=? and sync_direct=?'
    return await sqlite.get(sql, [user_id, note_id, type, direct]);
}

/**
 * 用户
 * @param user_id
 * @param type
 * @param direct
 * @returns {Promise<any>}
 */
exports.userNotes = async function(user_id, type, direct) {
    const sql = 'select * from syncs where user_id=? and sync_type=? and sync_direct=?'
    return await sqlite.all(sql, [user_id, type, direct]);
}

/**
 * 用户笔记同步数
 * @param user_id
 * @param type
 * @param direct
 * @returns {Promise<any>}
 */
exports.userNoteCount = async function(user_id, type, direct) {
    const sql = 'select COUNT(*) as note_count from syncs where user_id=? and sync_type=? and sync_direct=?'
    const row = await sqlite.get(sql, [user_id, type, direct]);
    let note_count = 0
    if (!common.empty(row) && !common.empty(row.note_count)) {
        note_count = row.note_count
    }
    return note_count
}

/**
 * collection 队列
 * @param user_id
 * @returns {Promise<*>}
 */
exports.downCollections = async function (user_id) {
    const sql = 'select * from syncs where user_id=? and sync_type=1 and sync_direct=1 order by status desc'
    const rows = await sqlite.all(sql, [user_id])
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * collection 队列
 * @param user_id
 * @returns {Promise<*>}
 */
exports.pushCollections = async function (user_id) {
    const sql = 'select * from syncs where user_id=? and sync_type=1 and sync_direct=2 order by status desc'
    const rows = await sqlite.all(sql, [user_id])
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 用户下行笔记本笔记队列
 * @param user_id
 * @param collection_id
 * @param direct
 * @param limit
 * @param columns
 * @returns {Promise<*>}
 */
exports.collectionNotes = async function (user_id, collection_id, direct = 1, limit = 0, columns = '*') {
    const params = [user_id, direct, collection_id]
    let sql = 'select ' + columns + ' from syncs where user_id=? and sync_type=21 and sync_direct=? and collection_id=? order by id'
    if (limit > 0) {
        sql = 'select ' + columns + ' from syncs where user_id=? and sync_type=21 and sync_direct=? and collection_id=? order by id limit ?'
        params.push(limit)
    }
    const rows = await sqlite.all(sql, params)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 用户笔记带状态队列列表
 * @param user_id
 * @param collection_id
 * @param status
 * @param direct
 * @param limit
 * @param columns
 * @returns {Promise<*>}
 */
exports.collectionStatusNotes = async function (user_id, collection_id, status = [0,1], direct = 1, limit = 0, columns = '*') {
    const params = [user_id, direct, collection_id]
    let sql = 'select ' + columns + ' from syncs where user_id=? and sync_type=21 and sync_direct=? and collection_id=? and status in (' + status.join(',') + ') order by id'
    if (limit > 0) {
        sql = 'select ' + columns + ' from syncs where user_id=? and sync_type=21 and sync_direct=? and collection_id=? and status in (' + status.join(',') + ') order by id limit ?'
        params.push(limit)
    }
    const rows = await sqlite.all(sql, params)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 用户下行笔记队列
 * @param user_id
 * @param limit
 * @returns {Promise<*>}
 */
exports.downNotes = async function (user_id, limit = 0) {
    const params = [user_id]
    let sql = 'select * from syncs where user_id=? and sync_type=21 and sync_direct=1 and status=0 order by id'
    if (limit > 0) {
        sql = 'select * from syncs where user_id=? and sync_type=21 and sync_direct=1 and status=0 order by id limit ?'
        params.push(limit)
    }
    const rows = await sqlite.all(sql, params)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 用户上行笔记队列
 * @param user_id
 * @param limit
 * @returns {Promise<*>}
 */
exports.pushNotes = async function (user_id, limit = 0) {
    const params = [user_id]
    let sql = 'select * from syncs where user_id=? and sync_type=21 and sync_direct=2 and status=0 order by id'
    if (limit > 0) {
        sql = 'select * from syncs where user_id=? and sync_type=21 and sync_direct=2 and status=0 order by id limit ?'
        params.push(limit)
    }
    const rows = await sqlite.all(sql, params)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 创建同步记录
 * @param user_id
 * @param type
 * @param direct
 * @param params
 * @returns {Promise<any>}
 */
exports.create = async function (user_id, type, direct, params = {}) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    let sql = "INSERT INTO syncs(#COLUMNS#) VALUES (#VALUES#)"
    const columns = ['user_id', 'sync_type', 'sync_direct', 'status']
    const values = ['?', '?', '?', 0], list = [user_id, type, direct]
    if (!common.empty(params.collection_id)) {
        columns.push('collection_id')
        values.push('?')
        list.push(params.collection_id)
    }
    if (!common.empty(params.member_id)) {
        columns.push('member_id')
        values.push('?')
        list.push(params.member_id)
    }
    if (!common.empty(params.member_name)) {
        columns.push('member_name')
        values.push('?')
        list.push(params.member_name)
    }
    if (!common.empty(params.member_avatar)) {
        columns.push('member_avatar')
        values.push('?')
        list.push(params.member_avatar)
    }
    if (!common.empty(params.note_id)) {
        columns.push('note_id')
        values.push('?')
        list.push(params.note_id)
    }
    if (!common.empty(params.hash_code)) {
        columns.push('hash_code')
        values.push('?')
        list.push(params.hash_code)
    }
    if (!common.empty(params.tag_id)) {
        columns.push('tag_id')
        values.push('?')
        list.push(params.tag_id)
    }
    if (!common.empty(params.image_id)) {
        columns.push('image_id')
        values.push('?')
        list.push(params.image_id)
    }
    if (!common.empty(params.postil_id)) {
        columns.push('postil_id')
        values.push('?')
        list.push(params.postil_id)
    }
    if (!common.empty(params.note_status)) {
        columns.push('note_status')
        values.push('?')
        list.push(params.note_status)
    }
    if (!common.empty(params.deleted_time)) {
        columns.push('deleted_time')
        values.push('?')
        list.push(params.deleted_time)
    }
    columns.push('created_at', 'updated_at')
    values.push('?', '?')
    list.push(save_time, save_time)
    sql = sql.replace('#COLUMNS#', columns.join(',')).replace('#VALUES#', values.join(','))
    return await sqlite.insert(sql, list);
}

/**
 * 修改状态
 * @param id
 * @param status
 * collection 0-待处理 1-下拉处理中 2-对应笔记处理中
 * note 0-待处理 1-处理中
 * @returns {Promise<any>}
 */
exports.status = async function (id, status) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE syncs SET status=?, updated_at=? WHERE id=?"
    return await sqlite.update(sql, [status, save_time, id]);
}

/**
 * 批量更新状态
 * @param ids
 * @param status
 * @returns {Promise<*>}
 */
exports.statusBatch = async function (ids, status) {
    if (common.empty(ids) || ids.length === 0) {
        return 0
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE syncs SET status=?, updated_at=? WHERE id in (" + ids.join(',') + ")"
    return await sqlite.update(sql, [status, save_time]);
}

/**
 * 删除同步记录
 * @param id
 * @returns {Promise<any>}
 */
exports.delete = async function (id) {
    return await sqlite.delete('syncs', 'id=' + id)
}

/**
 * 批量删除同步记录
 * @param where
 * @returns {Promise<any>}
 */
exports.deleteBatch = async function (where) {
    return await sqlite.delete('syncs', where)
}

/**
 * tag top 队列
 * @param user_id
 * @param tag_id
 * @returns {Promise<*>}
 */
exports.getUploadTagTop = async function (user_id, tag_id) {
    const sql = 'select * from syncs where user_id=? and sync_type=31 and sync_direct=2 and tag_id=? order by status desc'
    return await sqlite.get(sql, [user_id, tag_id])
}

/**
 *
 * @param user_id
 * @returns {Promise<void>}
 */
exports.uploadTagTopList = async function (user_id) {
    const sql = 'select * from syncs where user_id=? and sync_type=31 and sync_direct=2 order by status desc'
    return await sqlite.all(sql, [user_id, tag_id])
}