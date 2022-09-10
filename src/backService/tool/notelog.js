const sqlite = require('./logsqlitetool')
const common = require('./common')

/**
 * 获取同步记录
 * @param remote_id
 * @returns {Promise<any>}
 */
exports.getRemote = async function (remote_id) {
    const sql = 'select * from note_log where remote_id=?'
    return await sqlite.get(sql, [remote_id]);
}

/**
 * 获取最后同步时间
 * @returns {Promise<*>}
 */
exports.getLastLogId = async function () {
    const sql = 'select MAX(remote_id) as last_id from note_log'
    const record = await sqlite.get(sql)
    if (common.empty(record)) {
        return 0
    }
    return common.empty(record.last_id) ? 0 : record.last_id
}

/**
 * 初始化remote log
 * @param remote_id
 * @param note_id
 * @returns {Promise<void>}
 */
exports.initRemote = async function (remote_id, note_id) {
    const sql = "INSERT INTO note_log(remote_id, note_id) VALUES (?, ?)"
    return await sqlite.insert(sql, [remote_id, note_id]);
}

/**
 * 更新同步记录
 * @param remote_id
 * @param user_id
 * @param note_id
 * @param action
 * @param sync_time
 * @param create_time
 * @param update_time
 * @returns {Promise<void>}
 */
exports.updateRemote = async function (remote_id, user_id, note_id, action, sync_time, create_time, update_time) {
    const sql = 'UPDATE note_log SET user_id=?, note_id=?, action=?, sync_at=?, created_at=?, updated_at=? WHERE remote_id=?'
    return await sqlite.update(sql, [user_id, note_id, action, sync_time, create_time, update_time, remote_id])
}

/**
 * 批量删除记录
 * @param where
 * @returns {Promise<any>}
 */
exports.deleteBatch = async function (where) {
    return await sqlite.delete('note_log', where)
}

/**
 * 全部日志记录
 * @param columns
 * @returns {Promise<void>}
 */
exports.all = async function (columns = '*') {
    const sql = 'select #COLUMNS# from note_log'.replace('#COLUMNS#', columns)
    return await sqlite.all(sql)
}

