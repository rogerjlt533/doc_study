const common = require('../tool/common');
const httpTool = require('../tool/http');
const userService = require('../service/user')
const noteService = require('../service/note')
const messageService = require('../service/message')
const remote = require("@electron/remote");

/**
 * 初始化用户信息
 * @param token
 * @returns {Promise<{status_code: number, data: {bind_edu: number, badge: Array, user_hash: *, name: string, pk: *, avatar: string, token: *, wx_is_bind: number}, message: *}>}
 */
exports.initUserInfo = async function (token) {
    let wx_is_bind = 0, bind_edu = 0, badge = [], avatar = '', name = ''
    const user_id = common.decodeDesktop(token)
    const info = await httpTool.get(httpTool.host + 'api/desktop/user_info', {}, {hk: token})
    if (info.code === 200) {
        await userService.userTool.initUserInfo(user_id, info.data)
        await userService.userTool.initUserRight(user_id, info.data.status_info)
        avatar = info.data.avatar
        name = info.data.name
        wx_is_bind = info.data.wx_is_bind
        bind_edu = info.data.bind_edu
        badge = info.data.badge
    }
    return {status_code: 200, message: info.data.message, data: {token, user_hash: common.encode(user_id), pk: '', avatar, name, wx_is_bind, bind_edu, badge}}
}

/**
 * 登录
 * @param mobile
 * @param password
 * @returns {Promise<*>}
 */
exports.login = async function (mobile, password) {
    let wx_is_bind = 0, bind_edu = 0, badge = [], avatar = '', name = ''
    if (common.empty(mobile) || common.empty(password)) {
        return {status_code: 400, message: '参数错误', data: {token: '', user_hash: '', pk: '', wx_is_bind, bind_edu, badge}}
    }
    const data = await httpTool.post(httpTool.host + 'api/user/signin', {mobile, password: common.publicEncrypt(common.login_key, password)})
    if (data.code !== 200) {
        return {status_code: 400, message: data.message, data: {token: '', user_hash: '', pk: '', avatar, name, wx_is_bind, bind_edu, badge}}
    }
    const token = data.data.hk
    const pk = data.data.pk
    const user_id = common.decodeDesktop(token)
    const user_hash = common.encode(user_id)
    const info = await httpTool.get(httpTool.host + 'api/desktop/user_info', {}, {hk: token})
    if (info.code === 200) {
        await userService.userTool.initUserInfo(user_id, info.data)
        await userService.userTool.initUserRight(user_id, info.data.status_info)
        avatar = info.data.avatar
        name = info.data.name
        wx_is_bind = info.data.wx_is_bind
        bind_edu = info.data.bind_edu
        badge = info.data.badge
    }
    return {status_code: 200, message: data.message, data: {token, user_hash, pk, avatar, name, wx_is_bind, bind_edu, badge}}
}

/**
 * 手机验证码登录
 * @param mobile
 * @param code
 * @returns {Promise<*>}
 */
exports.mobileLogin = async function (mobile, code) {
    let wx_is_bind = 0, bind_edu = 0, badge = [], avatar = '', name = ''
    if (common.empty(mobile) || common.empty(code)) {
        return {status_code: 400, message: '参数错误', data: {token: '', user_hash: '', pk: '', wx_is_bind, bind_edu, badge}}
    }
    const data = await httpTool.post(httpTool.host + 'login/sms/verify', {mobile, code})
    if (data.code !== 200) {
        return {status_code: 400, message: data.message, data: {token: '', user_hash: '', pk: '', avatar, name, wx_is_bind, bind_edu, badge}}
    }
    const token = data.data.hk
    const pk = data.data.pk
    const user_id = common.decodeDesktop(token)
    const user_hash = common.encode(user_id)
    const info = await httpTool.get(httpTool.host + 'api/desktop/user_info', {}, {hk: token})
    if (info.code === 200) {
        await userService.userTool.initUserInfo(user_id, info.data)
        await userService.userTool.initUserRight(user_id, info.data.status_info)
        avatar = info.data.avatar
        name = info.data.name
        wx_is_bind = info.data.wx_is_bind
        bind_edu = info.data.bind_edu
        badge = info.data.badge
    }
    return {status_code: 200, message: data.message, data: {token, user_hash, pk, avatar, name, wx_is_bind, bind_edu, badge}}
}

/**
 * 微信扫码登录
 * @param code
 * @returns {Promise<*>}
 */
exports.wxQrLogin = async function (code) {
    let wx_is_bind = 0, bind_edu = 0, badge = [], avatar = '', name = ''
    if (common.empty(code)) {
        return {status_code: 400, message: '参数错误', data: {token: '', user_hash: '', pk: '', wx_is_bind, bind_edu, badge}}
    }
    const data = await httpTool.get(httpTool.host + 'api/user/login/wx/rotate', {code})
    if (data.code !== 200) {
        return {status_code: 400, message: data.message, data: {token: '', user_hash: '', pk: '', avatar, name, wx_is_bind, bind_edu, badge}}
    }
    const token = data.data.hk
    const pk = data.data.pk
    const user_id = common.decodeDesktop(token)
    const user_hash = common.encode(user_id)
    const info = await httpTool.get(httpTool.host + 'api/desktop/user_info', {}, {hk: token})
    if (info.code === 200) {
        await userService.userTool.initUserInfo(user_id, info.data)
        await userService.userTool.initUserRight(user_id, info.data.status_info)
        avatar = info.data.avatar
        name = info.data.name
        wx_is_bind = info.data.wx_is_bind
        bind_edu = info.data.bind_edu
        badge = info.data.badge
    }
    return {status_code: 200, message: data.message, data: {token, user_hash, pk, avatar, name, wx_is_bind, bind_edu, badge}}
}

/**
 * 刷新pro权限
 * @param token
 * @returns {Promise<{status_code: number, data: {}, message: string}>}
 */
exports.refreshProInfo = async function (token) {
    const user_id = common.decodeDesktop(token)
    const info = await httpTool.get(httpTool.sync_host + 'api/desktop/user_info', {}, {hk: token})
    if (info.code === 200) {
        await userService.userTool.initUserRight(user_id, info.data.status_info)
    }
    return {status_code: 200, message: '', data: {}}
}

/**
 * 刷新会员等级
 * @param user_id
 * @returns {Promise<void>}
 */
exports.refreshVip = async function (user_id) {
    user_id = common.decode(user_id)
    const today = common.sd.format(new Date(), 'YYYY-MM-DD');
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const {is_base, is_edu, is_pro, user_rights} = userService.userTool.userRights(user_id)
    if (is_pro === 1) {
        const pro = await userService.userTool.getPro(user_id)
        if (!common.empty(pro) && new Date(pro.end_time).getTime() >= new Date(today).getTime()) {
            const refresh_date = pro.refresh_time.slice(0, today.length)
            if (refresh_date !== today) {
                await userService.userTool.decrementPro(user_id, save_time)
            }
        }
    } else if (is_edu === 1) {
        const edu = await userService.userTool.getEdu(user_id)
        if (!common.empty(edu) && new Date(edu.end_time).getTime() >= new Date(today).getTime()) {
            const refresh_date = edu.refresh_time.slice(0, today.length)
            if (refresh_date !== today) {
                await userService.userTool.decrementEdu(user_id, save_time)
            }
        }
    }
}

/**
 * 用户基础信息
 * @param user_id
 * @returns {Promise<{status_code: number, data: {notes: *, star: number, is_pro: number, today: *, collection: {}, message: *, trash: *, is_edu: number}, message: string}>}
 */
exports.base = async function (user_id) {
    user_id = common.decode(user_id)
    const user_setting = await userService.userTool.setting(user_id)
    const default_collection = !common.empty(user_setting) ? common.encode(user_setting.default) : ''
    const all_notes = await noteService.noteTool.count(user_id, {status: 1, note_type: -1})
    const star_notes = 0
    const trash_notes = await noteService.noteTool.count(user_id, {status: 0, note_type: -1})
    const notice = await messageService.messageTool.messageCount(user_id, {read_status: 0})
    const last3days = await noteService.noteTool.count(user_id, {status: 1, today: 1, note_type: -1})
    const {is_base, is_edu, is_pro, user_rights} = await userService.userTool.userRights(user_id)
    return {status_code: 200, message: '', data: {
            notes: all_notes,
            star: star_notes,
            trash: trash_notes,
            today: last3days,
            message: notice,
            collection: {},
            is_edu, is_pro,
            default_collection
        }}
}

/**
 * 上报记录，附带上传db
 * @param hk
 * @param version
 * @param content
 * @returns {Promise<void>}
 * @returns {Promise<{status_code: number, data: {}, message: string}>}
 */
exports.report = async function (hk, version, content) {
    const userDataPath = remote.app.getPath("userData")
    const main_path = userDataPath + '/tnote.db'
    const sync_path = userDataPath + '/tsync.db'
    const log_path = userDataPath + '/tlog.db'
    const oplog_path = userDataPath + '/toplog.db'

    const upload_url = httpTool.host + 'api/user/upload'
    const report_url = httpTool.host + 'api/desktop/up_flow/report'
    let main_file = '', sync_file = '', log_file = '', oplog_file = ''
    if (!common.empty(main_path)) {
        let upload_res = await httpTool.upload(upload_url, main_path, {hk})
        if (upload_res.code === 200) {
            main_file = upload_res.data.file
        }
    }
    if (!common.empty(sync_path)) {
        let upload_res = await httpTool.upload(upload_url, sync_path, {hk})
        if (upload_res.code === 200) {
            sync_file = upload_res.data.file
        }
    }
    if (!common.empty(log_path)) {
        let upload_res = await httpTool.upload(upload_url, log_path, {hk})
        if (upload_res.code === 200) {
            log_file = upload_res.data.file
        }
    }
    if (!common.empty(oplog_path)) {
        let upload_res = await httpTool.upload(upload_url, oplog_path, {hk})
        if (upload_res.code === 200) {
            oplog_file = upload_res.data.file
        }
    }
    const plat_form = 'desktop'
    const up_params = {plat_form, version, content, main_file, sync_file, log_file, oplog_file}
    await httpTool.post(report_url, up_params, {hk})
    return {status_code: 200, message: '', data: {}}
}