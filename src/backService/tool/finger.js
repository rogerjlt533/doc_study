const fs = require('fs');
const sqlite = require('./sqlitepool');
const path = require('path');
const env = require('../config/env');
const sd = require('silly-datetime');
const common = require('./common');

exports.copyFile = async function (dest, source) {
    const destPath = path.join(env.resourceDir(), "upload", dest);
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(destPath);
    await readStream.pipe(writeStream);
}

/**
 * 用户保存图片
 * @param user_id
 * @param origin_name
 * @param file_path
 * @returns {Promise<{finger_id: number, path_value: string}>}
 */
exports.store = async function (user_id, origin_name, file_path) {
    let finger_id = 0, use_storage = 0;
    let content = await fs.readFileSync(file_path, 'utf-8').toString();
    const finger = common.md5(content)
    let fingerSql = "select * from file_finger where finger=?";
    const row = await sqlite.get(fingerSql, [finger]);
    let path_value = ''
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (common.empty(row)) {
        let fileExt = path.extname(file_path);
        let file_name = new Date().getSeconds() + common.randomcode(10) + fileExt
        path_value = 'upload/' + file_name
        let states = await fs.statSync(file_path)
        use_storage = (states.size / 1024).toFixed(5)
        await this.copyFile(file_name, file_path)
        let is_cloud = 0
        fingerSql = "INSERT INTO file_finger(remote_id, origin_name, file_name, path, suffix, finger, use_storage, is_cloud, created_at, updated_at) VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        finger_id = await sqlite.insert(fingerSql, [origin_name, file_name, path_value, fileExt.replace('.', ''), finger, use_storage, is_cloud, save_time, save_time]);
    } else {
        finger_id = row.id
        use_storage = row.use_storage
    }
    if (finger_id > 0) {
        let sql = "INSERT INTO user_file_relation(user_id, file_id, finger, use_storage, created_at, updated_at) VALUES (?, ?, ?, ? ,?, ?)"
        await sqlite.insert(sql, [user_id, finger_id, finger, use_storage, save_time, save_time]);
    }
    return {finger_id, path_value};
}

/**
 * 新建记录
 * @param remote_id
 * @param params
 * @param save_time
 * @param is_cloud
 * @returns {Promise<any>}
 */
exports.create = async function (remote_id, params = {}, save_time, is_cloud = 0) {
    const columns = ['remote_id', 'is_cloud', 'created_at', 'updated_at'], values = ['?', '?', '?', '?'], sql_params = [remote_id, is_cloud, save_time, save_time]
    if (params.hasOwnProperty('origin_name') && !common.empty(params.origin_name)) {
        columns.push('origin_name')
        values.push('?')
        sql_params.push(params.origin_name)
    }
    if (params.hasOwnProperty('file_name') && !common.empty(params.file_name)) {
        columns.push('file_name')
        values.push('?')
        sql_params.push(params.file_name)
    }
    if (params.hasOwnProperty('path') && !common.empty(params.path)) {
        columns.push('path')
        values.push('?')
        sql_params.push(params.path)
    }
    if (params.hasOwnProperty('suffix') && !common.empty(params.suffix)) {
        columns.push('suffix')
        values.push('?')
        sql_params.push(params.suffix)
    }
    if (params.hasOwnProperty('finger') && !common.empty(params.finger)) {
        columns.push('finger')
        values.push('?')
        sql_params.push(params.finger)
    }
    if (params.hasOwnProperty('use_storage') && !common.empty(params.use_storage)) {
        columns.push('use_storage')
        values.push('?')
        sql_params.push(params.use_storage)
    }
    if (params.hasOwnProperty('words') && !common.empty(params.words)) {
        columns.push('words')
        values.push('?')
        sql_params.push(params.words)
    }
    const sql = 'INSERT INTO file_finger(' + columns.join(',') + ') VALUES (' + values.join(',') + ')'
    return await sqlite.insert(sql, sql_params)
}

/**
 * 依据hash获取记录
 * @param finger
 * @returns {Promise<any>}
 */
exports.getByFinger = async function (finger) {
    const sql = 'SELECT * FROM file_finger WHERE finger=?'
    return await sqlite.get(sql, [finger])
}

/**
 * 获取用户资源
 * @param user_id
 * @param remote_id
 * @returns {Promise<any>}
 */
exports.getUserFinger = async function (user_id, remote_id) {
    const sql = 'SELECT * FROM user_file_relation WHERE user_id=? and remote_id=?'
    return await sqlite.get(sql, [user_id, remote_id])
}

/**
 * 绑定用户资源
 * @param user_id
 * @param file_id
 * @param use_storage
 * @param finger
 * @param save_time
 * @param remote_id
 * @returns {Promise<void>}
 */
exports.bindUser = async function (user_id, file_id, use_storage, finger, save_time, remote_id = 0) {
    const sql = 'INSERT INTO user_file_relation(remote_id, user_id, file_id, finger, use_storage, created_at, updated_at) VALUES (?, ?, ?, ?, ? ,?, ?)'
    await sqlite.insert(sql, [remote_id, user_id, file_id, finger, use_storage, save_time, save_time]);
}

/**
 * 获取用户资源
 * @param note_id
 * @param file_id
 * @returns {Promise<any>}
 */
exports.getNoteFinger = async function (note_id, file_id) {
    const sql = 'SELECT * FROM note_finger WHERE note_id=? and file_id=?'
    return await sqlite.get(sql, [note_id, file_id])
}

/**
 * 绑定note资源
 * @param note_id
 * @param file_id
 * @param save_time
 * @returns {Promise<void>}
 */
exports.bindNote = async function (note_id, file_id, save_time) {
    const sql = 'INSERT INTO note_finger(note_id, file_id, created_at, updated_at) VALUES (?, ?, ?, ?)'
    await sqlite.insert(sql, [note_id, file_id, save_time, save_time]);
}