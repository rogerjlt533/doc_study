const common = require('../tool/common');
const fingerTool = require('../tool/finger');

exports.fingerTool = fingerTool

/**
 * 保存远程资源
 * @param remote
 * @returns {Promise<*>}
 */
exports.storeRemote = async function (remote) {
    const {id, finger, created_at} = remote
    const file = await fingerTool.getByFinger(finger)
    let file_id = 0
    if (common.empty(file)) {
        file_id = await fingerTool.create(id, remote, created_at, 1)
    } else {
        file_id = file.id
    }
    if (common.empty(file_id)) {
        return 0
    }
    return file_id
}

/**
 * 保存用户远程资源
 * @param user_id
 * @param remote
 * @param save_time
 * @returns {Promise<void>}
 */
exports.storeUserRemote = async function (user_id, remote, save_time) {
    const {user_storage, finger, remote_relate} = remote
    const file_id = await this.storeRemote(remote)
    const user_finger = await fingerTool.getUserFinger(user_id, common.decode(remote_relate))
    if (!common.empty(user_finger)) {
        return user_finger.id
    }
    return await fingerTool.bindUser(user_id, file_id, user_storage, finger, save_time, common.decode(remote_relate))
}

/**
 * 保存note资源关联
 * @param user_id
 * @param note_id
 * @param remote
 * @param save_time
 * @returns {Promise<*>}
 */
exports.storeNoteRemote = async function (user_id, note_id, remote, save_time) {
    const file_id = await this.storeRemote(remote)
    const {use_storage, finger, remote_relate} = remote
    const user_finger = await fingerTool.getUserFinger(user_id, common.decode(remote_relate))
    if (common.empty(user_finger)) {
        await fingerTool.bindUser(user_id, file_id, use_storage, finger, save_time, common.decode(remote_relate))
    }
    if (common.empty(note_id)) {
        return 0
    }
    const relate = await fingerTool.getNoteFinger(note_id, file_id)
    if (!common.empty(relate)) {
        return relate
    }
    return await fingerTool.bindNote(note_id, file_id, save_time)
}