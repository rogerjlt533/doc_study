const sqlite = require('./sqlitepool');
const common = require('./common');

/**
 * 创建用户记录
 * @param remote_id
 * @param params
 * @param create_time
 * @param update_time
 * @returns {Promise<any>}
 */
exports.create = async function (remote_id, params = {}, create_time = '', update_time = '') {
    let sql = "INSERT INTO users(#COLUMNS#) VALUES (#VALUES#)"
    const columns = ['remote_id']
    const values = ['?'], list = [remote_id]
    if (!common.empty(params.name)) {
        columns.push('name')
        values.push('?')
        list.push(params.name)
    }
    if (!common.empty(params.email)) {
        columns.push('email')
        values.push('?')
        list.push(params.email)
    }
    if (!common.empty(params.email_is_check)) {
        columns.push('email_is_check')
        values.push('?')
        list.push(params.email_is_check)
    }
    if (!common.empty(params.mobile)) {
        columns.push('mobile')
        values.push('?')
        list.push(params.mobile)
    }
    if (!common.empty(params.avatar)) {
        columns.push('avatar')
        values.push('?')
        list.push(params.avatar)
    }
    if (!common.empty(params.domain)) {
        columns.push('domain')
        values.push('?')
        list.push(params.domain)
    }
    if (!common.empty(params.domain_is_set)) {
        columns.push('domain_is_set')
        values.push('?')
        list.push(params.domain_is_set)
    }
    columns.push('created_at', 'updated_at')
    values.push('?', '?')
    list.push(create_time, update_time)
    sql = sql.replace('#COLUMNS#', columns.join(',')).replace('#VALUES#', values.join(','))
    return await sqlite.insert(sql, list);
}

/**
 * 更新用户信息
 * @param remote_id
 * @param params
 * @param update_time
 * @returns {Promise<any>}
 */
exports.update = async function (remote_id, params = {}, update_time = '') {
    let sql = "UPDATE users SET #COLUMNS# WHERE remote_id=?"
    const columns = [], values = []
    if (params.hasOwnProperty('name')) {
        columns.push('name=?')
        values.push(params.name)
    }
    if (params.hasOwnProperty('email')) {
        columns.push('email=?')
        values.push(params.email)
    }
    if (params.hasOwnProperty('email_is_check')) {
        columns.push('email_is_check=?')
        values.push(params.email_is_check)
    }
    if (params.hasOwnProperty('avatar')) {
        columns.push('avatar=?')
        values.push(params.avatar)
    }
    if (params.hasOwnProperty('domain')) {
        columns.push('domain=?')
        values.push(params.domain)
    }
    if (params.hasOwnProperty('domain_is_set')) {
        columns.push('domain_is_set=?')
        values.push(params.domain_is_set)
    }
    columns.push('updated_at=?')
    values.push(update_time, remote_id)
    sql = sql.replace('#COLUMNS#', columns.join(','))
    return await sqlite.update(sql, values);
}

/**
 * 获取用户信息
 * @param user_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.get = async function (user_id, columns = '*') {
    const sql = "select #COLUMNS# from users where remote_id=?".replace('#COLUMNS#', columns)
    return await sqlite.get(sql, [user_id]);
}

/**
 * 获取教育版授权状态
 * @param user_id
 * @returns {Promise<{rights: {}, status: number}>}
 */
exports.userEduStatus = async function (user_id) {
    const sql = "select id from user_edu where user_id=? and is_check=1 and days>0"
    const row = await sqlite.get(sql, [user_id]);
    return {
        status: !common.empty(row) ? 1 : 0,
        rights: {
            expire: 0,
            single_file: 50,
            flow: 200,
            restore_from_history: 60,
            knowledge_link: 1,
            quick_note: 1,
            blog: 1,
            api: 1,
            team: 99,
            team_lib: 1,
            team_member: 99,
            team_auth: 1,
            ocr_limit: 99,
            ocr_month_limit: 2500,
            history_days: 7
        }
    }
}

/**
 * 获取个人pro版授权状态
 * @param user_id
 * @returns {Promise<{rights: {}, status: number}>}
 */
exports.userProfessionStatus = async function (user_id) {
    const sql = "select id from user_profession where user_id=? and days>0"
    const row = await sqlite.get(sql, [user_id]);
    return {
        status: !common.empty(row) ? 1 : 0,
        rights: {
            expire: 0,
            single_file: 100,
            flow: 500,
            restore_from_history: 90,
            knowledge_link: 1,
            quick_note: 1,
            blog: 1,
            api: 1,
            team: 999,
            team_lib: 1,
            team_member: 999,
            team_auth: 1,
            ocr_limit: 999,
            ocr_month_limit: 20000,
            history_days: 10000
        }
    }
}

/**
 * 获取用户权限
 * @param user_id
 * @returns {Promise<{is_base: number, user_rights: {ocr_month_limit: number, team_member: number, history_days: number, team: number, blog: number, single_file: number, team_lib: number, knowledge_link: number, team_auth: number, expire: number, restore_from_history: number, api: number, ocr_limit: number, flow: number, quick_note: number}, is_pro: number, is_edu: number}>}
 */
exports.userRights = async function (user_id) {
    let is_base = 0, is_edu = 0, is_pro = 0;
    let user_rights = {
        expire: 0,
        single_file: 3,
        flow: 100,
        restore_from_history: 30,
        knowledge_link: 1,
        quick_note: 0,
        blog: 0,
        api: 0,
        team: 1,
        team_lib: 0,
        team_member: 99,
        team_auth: 0,
        ocr_limit: 10,
        ocr_month_limit: 200,
        history_days: 0
    }
    const edu_res = await this.userEduStatus(user_id)
    const pro_res = await this.userProfessionStatus(user_id)
    if (edu_res.status === 1) {
        is_edu = 1
        user_rights = edu_res.rights
    } else if (pro_res.status === 1) {
        is_pro = 1
        user_rights = pro_res.rights
    } else {
        is_base = 1
    }
    return {is_base, is_edu, is_pro, user_rights}
}

/**
 * 用户配置
 * @param user_id
 * @returns {Promise<any>}
 */
exports.setting = async function (user_id) {
    const sql = "select * from user_setting where user_id=?"
    return await sqlite.get(sql, [user_id])
}

/**
 * 获取默认笔记本
 * @param user_id
 * @returns {Promise<*>}
 */
exports.getDefault = async function (user_id) {
    const record = await this.setting(user_id)
    if (common.empty(record)) {
        return 0
    }
    return common.empty(record.default) ? 0 : record.default
}

/**
 * 保存用户配置
 * @param user_id
 * @param params
 * @returns {Promise<boolean>}
 */
exports.storeSetting = async function(user_id, params = {}) {
    if (common.empty(user_id)) {
        return false
    }
    const setting = await this.setting(user_id)
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    if (common.empty(setting)) {
        const columns = ['user_id', 'created_at', 'updated_at'], values = ['?', '?', '?'], sql_params = [user_id, save_time, save_time]
        for (const index in params) {
            if (['statistic_notify', 'statistic_wx_notify', 'statistic_email_notify', 'note_public', 'default', 'fold_note'].indexOf(index) === -1) {
                continue
            }
            const column = index === 'default' ? '`default`' : index
            columns.push(column)
            values.push('?')
            sql_params.push(params[index])
        }
        const sql = "INSERT INTO user_setting(#COLUMNS#) VALUES (#VALUES#)"
            .replace('#COLUMNS#', columns.join(',')).replace('#VALUES#', values.join(','))
        await sqlite.insert(sql, sql_params)
    } else {
        const columns = [], values = []
        for (const index in params) {
            if (['statistic_notify', 'statistic_wx_notify', 'statistic_email_notify', 'note_public', 'default', 'fold_note'].indexOf(index) === -1) {
                continue
            }
            const column = index === 'default' ? '`default`' : index
            columns.push(column + '=?')
            values.push(params[index])
        }
        columns.push('updated_at=?')
        values.push(save_time, user_id)
        const sql = "UPDATE user_setting SET #COLUMNS# WHERE user_id=?".replace('#COLUMNS#', columns.join(','))
        await sqlite.update(sql, values);
    }
    return true
}

/**
 * 创建pro记录
 * @param remote_id
 * @param days
 * @param end_time
 * @param create_time
 * @returns {Promise<any>}
 */
exports.createPro = async function (remote_id, days, end_time, create_time = '') {
    const sql = "INSERT INTO user_profession(user_id, days, refresh_time, end_time, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    return await sqlite.insert(sql, [remote_id, days, create_time, end_time, create_time, create_time]);
}

/**
 * 获取pro记录
 * @param user_id
 * @returns {Promise<any>}
 */
exports.getPro = async function (user_id) {
    const sql = "select id from user_profession where user_id=?"
    return await sqlite.get(sql, [user_id]);
}

/**
 * 修改pro记录
 * @param remote_id
 * @param days
 * @param end_time
 * @param save_time
 * @returns {Promise<any>}
 */
exports.updatePro = async function (remote_id, days, end_time, save_time = '') {
    const sql = "UPDATE user_profession SET days=?,refresh_time=?,end_time=?,updated_at=? WHERE user_id=?"
    return await sqlite.update(sql, [days, save_time, end_time, save_time, remote_id]);
}

/**
 * pro会员递减
 * @param user_id
 * @param save_time
 * @returns {Promise<any>}
 */
exports.decrementPro = async function (user_id, save_time) {
    const sql = "UPDATE user_profession SET days=days-1,refresh_time=?,updated_at=? WHERE user_id=? and days>0"
    return await sqlite.update(sql, [save_time, save_time, user_id]);
}

/**
 * 创建edu记录
 * @param remote_id
 * @param email
 * @param is_check
 * @param days
 * @param end_time
 * @param create_time
 * @returns {Promise<any>}
 */
exports.createEdu = async function (remote_id, email, is_check, days, end_time, create_time = '') {
    const sql = "INSERT INTO user_edu(user_id, edu_email, is_check, days, refresh_time, end_time, created_at, updated_at) VALUES (?,?,?,?,?,?)"
    return await sqlite.insert(sql, [remote_id, email, is_check, days, create_time, end_time, create_time, create_time]);
}

/**
 * 获取edu记录
 * @param user_id
 * @returns {Promise<any>}
 */
exports.getEdu = async function (user_id) {
    const sql = "select id from user_edu where user_id=?"
    return await sqlite.get(sql, [user_id]);
}

/**
 * 修改edu记录
 * @param remote_id
 * @param email
 * @param is_check
 * @param days
 * @param end_time
 * @param save_time
 * @returns {Promise<any>}
 */
exports.updateEdu = async function (remote_id, email, is_check, days, end_time, save_time = '') {
    const sql = "UPDATE user_edu SET edu_email?, is_check=?, days=?, refresh_time=?, end_time=?, updated_at=? WHERE user_id=?"
    return await sqlite.update(sql, [email, is_check, days, save_time, end_time, save_time, remote_id]);
}

/**
 * edu会员递减
 * @param user_id
 * @param save_time
 * @returns {Promise<any>}
 */
exports.decrementEdu = async function (user_id, save_time) {
    const sql = "UPDATE user_edu SET days=days-1,refresh_time=?,updated_at=? WHERE user_id=? and days>0"
    return await sqlite.update(sql, [save_time, save_time, user_id]);
}

/**
 * 初始化用户信息
 * @param remote_id
 * @param data
 * @returns {Promise<void>}
 */
exports.initUserInfo = async function (remote_id, data) {
    const user = await this.get(remote_id)
    if (common.empty(user)) {
        await this.create(remote_id, data, data.created_at, data.created_at)
    } else {
        const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        await this.update(remote_id, data, save_time)
    }
    await this.storeSetting(remote_id, {})
}

/**
 * 初始化用户信息
 * @param user_id
 * @param data
 * @returns {Promise<void>}
 */
exports.initUserRight = async function (user_id, data) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    if (data.is_pro === 1) {
        const pro = await this.getPro(user_id)
        if (common.empty(pro)) {
            await this.createPro(user_id, data.days, data.end_time, save_time)
        } else {
            await this.updatePro(user_id, data.days, data.end_time, save_time)
        }
    } else if (data.is_edu === 1) {
        const edu = await this.getEdu(user_id)
        if (common.empty(edu)) {
            await this.createEdu(user_id, data.info.edu_email, data.info.is_check, data.days, data.end_time, save_time)
        } else {
            await this.updatePro(user_id, data.days, data.end_time, save_time)
        }
    }
}
