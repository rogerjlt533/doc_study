const common = require('../tool/common');
const httpTool = require('../tool/http');
const opLogSqliteTool = require('../tool/oplogsqlitetool')

exports.opLogSqliteTool = opLogSqliteTool

/**
 * 获取日志记录
 * @param id
 * @returns {Promise<any>}
 */
exports.get = async function (id) {
    const sql = 'select * from user_operate_log where id=?'
    return await opLogSqliteTool.get(sql, [id]);
}

/**
 * 更新is_upload
 * @param id
 * @param is_upload
 * @returns {Promise<void>}
 */
exports.updateIsUpload = async function(id, is_upload) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE user_operate_log SET is_upload=?, updated_at=? WHERE id=?"
    return await opLogSqliteTool.update(sql, [is_upload, save_time, id]);
}

/**
 * 创建日志记录
 * @param user_id
 * @param behavior
 * @param opr_direct
 * @param params
 * @returns {Promise<any>}
 */
exports.create = async function (user_id, behavior, opr_direct, params = {}) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    let sql = "INSERT INTO user_operate_log(#COLUMNS#) VALUES (#VALUES#)"
    const columns = ['user_id', 'behavior', 'opr_direct', 'is_upload']
    const values = ['?', '?', '?', 0], list = [user_id, behavior, opr_direct]
    if (!common.empty(params.obj_type)) {
        columns.push('obj_type')
        values.push('?')
        list.push(params.obj_type)
    }
    if (!common.empty(params.obj_id)) {
        columns.push('obj_id')
        values.push('?')
        list.push(params.obj_id)
    }
    if (!common.empty(params.remote_id)) {
        columns.push('remote_id')
        values.push('?')
        list.push(params.remote_id)
    }
    if (!common.empty(params.download_value)) {
        columns.push('download_value')
        values.push('?')
        list.push(params.download_value)
    }
    if (!common.empty(params.upload_value)) {
        columns.push('upload_value')
        values.push('?')
        list.push(params.upload_value)
    }
    if (!common.empty(params.result_value)) {
        columns.push('result_value')
        values.push('?')
        list.push(params.result_value)
    }
    if (!common.empty(params.response_value)) {
        columns.push('response_value')
        values.push('?')
        list.push(params.response_value)
    }
    columns.push('created_at', 'updated_at')
    values.push('?', '?')
    list.push(save_time, save_time)
    sql = sql.replace('#COLUMNS#', columns.join(',')).replace('#VALUES#', values.join(','))
    return await opLogSqliteTool.insert(sql, list);
}

/**
 * 上传日志
 * @param token
 * @param id
 * @param version
 * @returns {Promise<boolean>}
 */
exports.uploadLog = async function (token, id, version = '') {
    const record = await this.get(id)
    if (common.empty(record)) {
        return false
    }
    if (common.empty(record.remote_id)) {
        return false
    }
    const json = {
        behavior: record.behavior, operate_obj: record.obj_type, operate_direct: record.opr_direct, remote_id: record.remote_id, local_id: record.obj_id, source: 'desktop',
        response_value: record.response_value, download_value: record.download_value, upload_value: record.upload_value, result: record.result_value, version
    }
    const result = await httpTool.post(httpTool.host + 'api/funnel/log', json, {hk: token})
    if (result.code !== 200) {
        return false
    }
    await this.updateIsUpload(id, 1)
    return true
}

