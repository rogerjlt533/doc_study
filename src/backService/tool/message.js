const sqlite = require('./sqlitepool');
const common = require('./common');

/**
 * 获取消息列表
 * @param user_id
 * @param params
 * @param orderby
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<*>}
 */
exports.messages = async function (user_id, params = [], orderby, page, size, columns = ['id', 'send_user', 'msg_content', 'msg_content', 'msg_content', 'read_status', 'created_at']) {
    const where = ['receive_user=?']
    const options = [user_id]
    if (!common.empty(params.type) && params.type.length > 0) {
        where.push("msg_type in (" + params.type.join(',') + ")")
    }
    if (params.hasOwnProperty('read_status')) {
        where.push("read_status=?")
        options.push(params.read_status)
    }
    options.push(size, common.getPageOffset(page, size))
    let sql = "select #COLUMN# from messages where #WHERE# and deleted_at is null #ORDER_BY# limit ?, offset ?"
    sql = sql.replace('#COLUMN#', columns.join(',')).replace('#WHERE#', where.join(' and '))
        .replace('#ORDER_BY#', common.empty(orderby) ? '' : "order by " + orderby)
    const rows = await sqlite.all(sql, options);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 消息总计数
 * @param user_id
 * @param params
 * @returns {Promise<*>}
 */
exports.messageCount = async function (user_id, params = []) {
    const where = ['receive_user=?']
    const options = [user_id]
    if (!common.empty(params.type) && params.type.length > 0) {
        where.push("msg_type in (" + params.type.join(',') + ")")
    }
    if (params.hasOwnProperty('read_status')) {
        where.push("read_status=?")
        options.push(params.read_status)
    }
    let sql = "select count(*) as ts_count from messages where #WHERE# and deleted_at is null"
    sql = sql.replace('#WHERE#', where.join(' and '))
    const row = await sqlite.get(sql, options);
    if (!common.empty(row) && row.ts_count > 0) {
        return row.ts_count
    }
    return 0
}

/**
 * 消息hash加密
 * @param message
 * @param columns
 * @returns {*}
 */
exports.encode = function (message, columns = []) {
    if (common.empty(columns)) {
        return message
    }
    if (columns.length === 0) {
        return message
    }
    for (const key of columns) {
        message[key] = common.encode(message[key])
    }
    return message
}

/**
 * 消息标记已读
 * @param message_id
 * @returns {Promise<any>}
 */
exports.mark = async function (message_id) {
    let sql = "UPDATE messages SET read_status=1 where id=?"
    return await sqlite.update(sql, [message_id]);
}

/**
 * 全部消息标记已读
 * @param user_id
 * @returns {Promise<any>}
 */
exports.markAll = async function (user_id) {
    let sql = "UPDATE messages SET read_status=1 where receive_user=? and read_status=0 and deleted_at is null"
    return await sqlite.update(sql, user_id);
}