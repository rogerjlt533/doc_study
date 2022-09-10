const common = require('../tool/common');
const messageService = require('../service/message');

/**
 * 消息列表
 * @param user_id
 * @param type Array
 * @param page
 * @param size
 * @returns {Promise<*>}
 */
exports.list = async function (user_id, type, page = 1, size = 20) {
    user_id = common.decode(user_id)
    if (common.empty(type)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    if (type.length === 0) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    const list = await messageService.messageTool.messages(user_id, {type}, '', page, size)
    const count = await messageService.messageTool.messageCount(user_id, {type})
    for (const index in list) {
        list[index] = await messageService.messageTool.encode(list[index], ["id", 'msg_type', 'receive_user', 'send_user'])
    }
    return {status_code: 200, message: 'success', data: {list, count}}
}

/**
 * 我的消息列表
 * @param user_id
 * @param page
 * @param size
 * @returns {Promise<*>}
 */
exports.mine = async function (user_id, page = 1, size = 20) {
    return this.list(user_id, [1], page, size)
}

/**
 * 消息标记已读
 * @param message_id
 * @returns {Promise<*>}
 */
exports.mark = async function (message_id) {
    if (common.empty(message_id)) {
        return {status_code: 400, message: '参数错误', data: {}}
    }
    message_id = common.decode(message_id)
    await messageService.messageTool.mark(message_id)
    return {status_code: 200, message: 'success', data: {}}
}

/**
 * 全部消息标记已读
 * @param user_id
 * @returns {Promise<{status_code: number, data: {}, message: string}>}
 */
exports.markAll = async function (user_id) {
    user_id = common.decode(user_id)
    await messageService.messageTool.markAll(user_id)
    return {status_code: 200, message: 'success', data: {}}
}