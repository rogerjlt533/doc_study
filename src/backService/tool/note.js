const env = require('../config/env');
const common = require('./common');
const sqlite = require('./sqlitepool');
const collectionTool = require('./collection')

const _note_list = {}

exports.note_list = _note_list

/**
 * 创建note记录
 * @param user_id
 * @param collection_id
 * @param note_type
 * @param source
 * @param content
 * @param url
 * @param tag_json
 * @param struct_tag_json
 * @param save_time
 * @returns {Promise<*>}
 */
exports.create = async function (user_id, collection_id, note_type, source, content, url, tag_json, struct_tag_json, save_time = '') {
    if (common.empty(collection_id)) {
        return 0;
    }
    url = !common.empty(url) ? url : ''
    tag_json = !common.empty(tag_json) ? tag_json : ''
    struct_tag_json = !common.empty(struct_tag_json) ? struct_tag_json : ''
    if (common.empty(save_time)) {
        save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    }
    const notag_content = common.strip(content)
    const hash = this.noteHash(content, collection_id, save_time)
    const sql = "INSERT INTO notes(user_id, collection_id, note, content, note_type, source, status, url, tag_json, struct_tag_json, hash_code, compare_code, created_at, updated_at, last_update)" +
        " VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [user_id, collection_id, content, notag_content, note_type, source, url, tag_json, struct_tag_json, hash, hash, save_time, save_time, save_time]);
}

/**
 * 保存远程note记录
 * @param remote_id
 * @param user_id
 * @param collection_id
 * @param note_type
 * @param source
 * @param content
 * @param weight
 * @param url
 * @param tag_json
 * @param hash
 * @param struct_tag_json
 * @param status
 * @param create_time
 * @param update_time
 * @param last_update
 * @returns {Promise<*>}
 */
exports.storeRemote = async function (remote_id, user_id, collection_id, note_type, source, content, weight, url, tag_json, hash, struct_tag_json, status, create_time, update_time, last_update) {
    if (common.empty(collection_id)) {
        return 0;
    }
    url = !common.empty(url) ? url : ''
    weight = !common.empty(weight) ? weight : 0
    tag_json = !common.empty(tag_json) ? tag_json : ''
    struct_tag_json = !common.empty(struct_tag_json) ? struct_tag_json : ''
    const record = await this.remote(remote_id)
    const notag_content = common.strip(content)
    if (common.empty(record)) {
        const sql = "INSERT INTO notes(user_id, remote_id, collection_id, note, content, weight, note_type, source, status, url, tag_json, struct_tag_json, hash_code, created_at, updated_at, last_update)" +
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        return await sqlite.insert(sql, [user_id, remote_id, collection_id, content, notag_content, weight, note_type, source, status, url, tag_json, struct_tag_json, hash, create_time, update_time, last_update]);
    }
    const sql = "UPDATE notes SET collection_id=?, note=?, content=?, weight=?, note_type=?, source=?, status=?, url=?, tag_json=?, struct_tag_json=?, hash_code=?, updated_at=?, last_update=? WHERE remote_id=?"
    return await sqlite.update(sql, [collection_id, content, notag_content, weight, note_type, source, status, url, tag_json, struct_tag_json, hash, update_time, last_update, remote_id])
}

/**
 * 获取
 * @param content
 * @param collection_id
 * @param create_time
 */
exports.noteHash = function (content, collection_id, create_time) {
    const json = {content, create_time}
    return common.md5(JSON.stringify(json))
}

/**
 * 编辑笔记
 * @param note_id
 * @param collection_id
 * @param content
 * @param tag_json
 * @param struct_tag_json
 * @param create_time
 * @param last_update
 * @param updated_at
 * @returns {Promise<*>}
 */
exports.update = async function (note_id, collection_id, content, tag_json, struct_tag_json, create_time, last_update = '', updated_at = '') {
    if (common.empty(collection_id)) {
        return 0;
    }
    tag_json = !common.empty(tag_json) ? tag_json : ''
    struct_tag_json = !common.empty(struct_tag_json) ? struct_tag_json : ''
    if (common.empty(last_update)) {
        last_update = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    }
    if (common.empty(updated_at)) {
        updated_at = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    }
    const notag_content = common.strip(content)
    const hash = this.noteHash(content, collection_id, create_time)
    const sql = "update notes set note=?, content=?, tag_json=?, struct_tag_json=?, collection_id=?, hash_code=?, last_update=?, updated_at=? where id=?"
    return await sqlite.update(sql, [content, notag_content, tag_json, struct_tag_json, collection_id, hash, last_update, updated_at, note_id]);
}

/**
 * 更改笔记类型
 * @param note_id
 * @param note_type
 * @param tag_json
 * @param struct_tag_json
 * @param save_time
 * @returns {Promise<void>}
 */
exports.updateNoteType = async function (note_id, note_type, tag_json, struct_tag_json, save_time = '') {
    tag_json = !common.empty(tag_json) ? tag_json : ''
    struct_tag_json = !common.empty(struct_tag_json) ? struct_tag_json : ''
    if (common.empty(save_time)) {
        save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    }
    const sql = "update notes set note_type=?, tag_json=?, struct_tag_json=?, last_update=?, updated_at=? where id=?"
    return await sqlite.update(sql, [note_type, tag_json, struct_tag_json, save_time, save_time, note_id]);
}

/**
 * 填充笔记无标签内容
 * @param note_id
 * @param content
 * @returns {Promise<void>}
 */
exports.fillNoteContent = async function (note_id, content) {
    const sql = "update notes set content=? where id=?"
    return await sqlite.update(sql, [content, note_id]);
}

/**
 * 更换笔记本
 * @param note
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.changeCollection = async function (note, collection_id) {
    if (common.empty(collection_id)) {
        return 0;
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const hash = this.noteHash(note.note, collection_id, note.created_at)
    const sql = "update notes set collection_id=?, compare_code=?, last_update=?, updated_at=? where id=?"
    return await sqlite.update(sql, [collection_id, hash, save_time, save_time, note.id]);
}

/**
 * 获取note记录
 * @param note_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.get = async function (note_id, columns = '*') {
    const sql = 'select #COLUMN# from notes where id=? and deleted_at is null'.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [note_id]);
}

/**
 * 获取note记录
 * @param note_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.getNoStatus = async function (note_id, columns = '*') {
    const sql = 'select #COLUMN# from notes where id=?'.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [note_id]);
}

/**
 * collection有效笔记列表
 * @param collection_id
 * @param columns
 * @returns {Promise<Array>}
 */
exports.collectionNotes = async function(collection_id, columns = 'id,user_id,note,collection_id') {
    const sql = 'select #COLUMN# from notes where collection_id=? and note_type=1 and status=1 and deleted_at is null'.replace('#COLUMN#', columns);
    const rows = await sqlite.all(sql, [collection_id]);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 带状态查询collection笔记列表
 * @param collection_id
 * @param status
 * @param columns
 * @returns {Promise<*>}
 */
exports.collectionStatusNotes = async function (collection_id, status = [0,1], columns = '*') {
    const sql = 'select #COLUMN# from notes where collection_id=? and status in (#STATUS_LIST#) and deleted_at is null'.replace('#STATUS_LIST#', status.join(',')).replace('#COLUMN#', columns)
    const rows = await sqlite.all(sql, [collection_id]);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 获取note列表
 * @param collection_id
 * @param user_id
 * @param status
 * @param columns
 * @returns {Promise<*>}
 */
exports.list = async function (collection_id, user_id = 0, status = 1, columns = '*') {
    const conditions = ['collection_id=' + collection_id]
    let sql = "select #COLUMNS# from notes where #CONDITION#".replace('#COLUMNS#', columns)
    if (user_id > 0) {
        conditions.push('user_id=' + user_id)
    }
    if (status === 1) {
        conditions.push('deleted_at is null')
    } else if (status === 0) {
        conditions.push('deleted_at != null')
    }
    sql = sql.replace('#CONDITION#', conditions.join(' and '))
    const rows = await sqlite.all(sql)
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 带状态用户笔记列表
 * @param user_id
 * @param status
 * @param columns
 * @returns {Promise<*>}
 */
exports.userStatusNotes = async function (user_id, status = [0,1], columns = '*') {
    const sql = 'select #COLUMN# from notes where user_id=? and status in (#STATUS_LIST#) and deleted_at is null'.replace('#STATUS_LIST#', status.join(',')).replace('#COLUMN#', columns)
    const rows = await sqlite.all(sql, [user_id]);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * 更改笔记权重内容
 * @param note_id
 * @param weight
 * @returns {Promise<void>}
 */
exports.updateNoteWeightValue = async function (note_id, weight) {
    weight = weight > 0 ? weight : 0
    const sql = "update notes set weight=" + weight + " where id=?"
    return await sqlite.update(sql, [note_id]);
}

/**
 * 更新笔记权重
 * @param note_id
 * @param disc
 * @param save_time
 * @returns {Promise<number>}
 */
exports.updateNoteWeight = async function (note_id, disc, save_time = null) {
    const note = await this.get(note_id)
    if (common.empty(note)) {
        return 0
    }
    const conditions = []
    if (!common.empty(save_time)) {
        conditions.push("last_update='" + save_time + "'")
    }
    if (note.weight + disc >= 0) {
        conditions.push("weight=weight + " + disc)
        const sql = "update notes set " + conditions.join(", ") + " where id=?"
        return await sqlite.update(sql, [note_id]);
    } else {
        conditions.push("weight=0")
        const sql = "update notes set " + conditions.join(", ") + " where id=?"
        return await sqlite.update(sql, [note_id]);
    }
}

/**
 * 关键字查询
 * @param user_id
 * @param params
 * @param sort
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<Array>}
 */
exports.notesWithKeyword = async function (user_id, params, sort = 'desc', page = 1, size = 10, columns = ['id', 'user_id', 'note', 'collection_id', 'note_type', 'is_share', 'share_code', 'created_at', 'last_update', 'updated_at', 'status', 'url']) {
    if (common.empty(user_id)) {
        return []
    }
    const tag_id = common.empty(params.tag_id) ? 0 : params.tag_id
    const group_id = common.empty(params.group_id) ? 0 : params.group_id
    const keyword = common.empty(params.keyword) ? '' : params.keyword
    const keywords = common.empty(params.keywords) ? '' : params.keywords
    const collection_id = common.empty(params.collection_id) ? 0 : params.collection_id
    const today = common.empty(params.today) ? 0 : params.today
    const share = common.empty(params.share) ? 0 : params.share
    const is_group = common.empty(params.is_group) ? 1 : params.is_group
    const status = common.empty(params.status) ? 0 : params.status
    const note_type = common.empty(params.note_type) ? 1 : params.note_type
    sort = common.empty(sort) ? 'desc' : sort
    let sort_column = common.empty(params.sort_column) ? 'notes.last_update' : params.sort_column
    let time_column = common.empty(params.orderby_create) ? sort_column : 'notes.created_at'
    sort_column = common.empty(params.orderby_create) ? sort_column : 'notes.created_at'
    sort_column = common.empty(params.orderby_weight) ? sort_column : 'notes.weight'
    const left_join = [], conditions = [], options = []
    let sql = "select #COLUMN# from notes #LEFT_JOIN# where #CONDITION# order by " + sort_column + " " + sort + " limit ? offset ?"
    if (!common.empty(tag_id) || !common.empty(group_id)) {
        left_join.push("left join note_tag_relation on note_tag_relation.note_id=notes.id")
        conditions.push("note_tag_relation.deleted_at is null")
    }
    if (!common.empty(tag_id)) {
        conditions.push("note_tag_relation.tag_id=?")
        options.push(tag_id)
    }
    if (!common.empty(group_id)) {
        conditions.push("note_tag_relation.group_id=?")
        options.push(group_id)
    }
    if (!common.empty(params.start_time)) {
        conditions.push(time_column + ">='" + params.start_time + "'")
    }
    if (!common.empty(params.end_time)) {
        conditions.push(time_column + "<='" + params.end_time + " 23:59:59'")
    }
    if (!common.empty(collection_id)) {
        conditions.push("notes.collection_id=?")
        options.push(collection_id)
    } else {
        const join_list = await collectionTool.joinedList(user_id, 'collection_id')
        if (common.empty(join_list)) {
            return []
        }
        conditions.push("notes.collection_id in (" + common.list_column(join_list, 'collection_id').join(',') + ")")
    }
    if (!common.empty(today)) {
        const now = new Date()
        const day_start = common.sd.format(now - 86400000 * 3, 'YYYY-MM-DD HH:mm:ss')
        const day_end = common.sd.format(now, 'YYYY-MM-DD HH:mm:ss')
        conditions.push("notes.created_at>=? and notes.created_at<=?")
        options.push(day_start, day_end)
    }
    if (!common.empty(share)) {
        conditions.push("notes.is_share=?")
        options.push(share)
    }
    if (is_group === 1) {
        conditions.push("notes.user_id=?")
        options.push(user_id)
    }
    if (status !== 2) {
        conditions.push("notes.status=?")
        conditions.push("notes.deleted_at is null")
        options.push(status)
    }
    if (note_type > 0) {
        conditions.push("notes.note_type=?")
        options.push(note_type)
    }
    if (!common.empty(keyword)) {
        conditions.push("notes.content like '%" + keyword + "%'")
    }
    if (!common.empty(keywords)) {
        const like_list = []
        for (const value of keywords) {
            if (common.empty(value)) {
                continue
            }
            like_list.push("notes.content like '%" + value + "%'")
        }
        if (like_list.length > 0) {
            let search_opr = common.empty(params.search_opr) ? 'and' : params.search_opr
            if (search_opr !== 'or') {
                search_opr = 'and'
            }
            conditions.push("(" + like_list.join(search_opr) + ")")
        }
    }
    options.push(size, common.getPageOffset(page, size))
    sql = sql.replace('#CONDITION#', conditions.join(' and '))
    sql = sql.replace('#COLUMN#', columns.map((item, index) => {return index > 0 ? "notes." + item : "distinct notes." + item}).join(','))
    sql = sql.replace('#LEFT_JOIN#', left_join.join(' '))
    console.log({type: 'keyword', sql, options})
    const rows = await sqlite.all(sql, options);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * note列表
 * @param user_id
 * @param params
 * @param sort
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<Array>}
 */
exports.notes = async function (user_id, params, sort = 'desc', page = 1, size = 10, columns = ['id', 'remote_id', 'user_id', 'note', 'collection_id', 'note_type', 'is_share', 'share_code', 'created_at', 'last_update', 'updated_at', 'status', 'url']) {
    if (common.empty(user_id)) {
        return []
    }
    const keyword = common.empty(params.keyword) ? '' : params.keyword
    const keywords = common.empty(params.keywords) ? [] : params.keywords
    if (!common.empty(keyword) || !common.empty(keywords)) {
        return await this.notesWithKeyword(user_id, params, sort, page, size, columns)
    }
    const select_columns = ['id']
    const tag_id = common.empty(params.tag_id) ? 0 : params.tag_id
    const group_id = common.empty(params.group_id) ? 0 : params.group_id
    const collection_id = common.empty(params.collection_id) ? 0 : params.collection_id
    const today = common.empty(params.today) ? 0 : params.today
    const share = common.empty(params.share) ? 0 : params.share
    const is_group = common.empty(params.is_group) ? 1 : params.is_group
    const status = common.empty(params.status) ? 0 : params.status
    const note_type = common.empty(params.note_type) ? 1 : params.note_type
    sort = common.empty(sort) ? 'desc' : sort
    let sort_column = common.empty(params.sort_column) ? 'notes.last_update' : params.sort_column
    let time_column = common.empty(params.orderby_create) ? sort_column : 'notes.created_at'
    sort_column = common.empty(params.orderby_create) ? sort_column : 'notes.created_at'
    sort_column = common.empty(params.orderby_weight) ? sort_column : 'notes.weight'
    const left_join = [], conditions = [], options = []
    let sql = "select #COLUMN# from notes #LEFT_JOIN# where #CONDITION# order by " + sort_column + " " + sort + " limit ? offset ?"
    if (!common.empty(tag_id) || !common.empty(group_id)) {
        left_join.push("left join note_tag_relation on note_tag_relation.note_id=notes.id")
        conditions.push("note_tag_relation.deleted_at is null")
    }
    if (!common.empty(tag_id)) {
        conditions.push("note_tag_relation.tag_id=?")
        options.push(tag_id)
    }
    if (!common.empty(group_id)) {
        conditions.push("note_tag_relation.group_id=?")
        options.push(group_id)
    }
    if (!common.empty(params.start_time)) {
        conditions.push(time_column + ">='" + params.start_time + "'")
    }
    if (!common.empty(params.end_time)) {
        conditions.push(time_column + "<='" + params.end_time + " 23:59:59'")
    }
    if (!common.empty(collection_id)) {
        conditions.push("notes.collection_id=?")
        options.push(collection_id)
    } else {
        const join_list = await collectionTool.joinedList(user_id, 'collection_id')
        if (common.empty(join_list)) {
            return []
        }
        conditions.push("notes.collection_id in (" + common.list_column(join_list, 'collection_id').join(',') + ")")
    }
    if (!common.empty(today)) {
        const now = new Date()
        const day_start = common.sd.format(now - 86400000 * 3, 'YYYY-MM-DD HH:mm:ss')
        const day_end = common.sd.format(now, 'YYYY-MM-DD HH:mm:ss')
        conditions.push("notes.created_at>=? and notes.created_at<=?")
        options.push(day_start, day_end)
    }
    if (!common.empty(share)) {
        conditions.push("notes.is_share=?")
        options.push(share)
    }
    if (is_group === 1) {
        conditions.push("notes.user_id=?")
        options.push(user_id)
    }
    if (status !== 2) {
        conditions.push("notes.status=?")
        conditions.push("notes.deleted_at is null")
        options.push(status)
    }
    if (note_type > 0) {
        conditions.push("notes.note_type=?")
        options.push(note_type)
    }
    options.push(size, common.getPageOffset(page, size))
    sql = sql.replace('#CONDITION#', conditions.join(' and '))
    sql = sql.replace('#COLUMN#', select_columns.map((item, index) => {return index > 0 ? "notes." + item : "distinct notes." + item}).join(','))
    sql = sql.replace('#LEFT_JOIN#', left_join.join(' '))
    console.log({sql, options})
    const rows = await sqlite.all(sql, options);
    if (common.empty(rows)) {
        return []
    }
    for (const index in rows) {
        rows[index] = await this.getNoStatus(rows[index].id, columns.join(','))
    }
    return rows
}

/**
 * note计数
 * @param user_id
 * @param params
 * @returns {Promise<*>}
 */
exports.count = async function (user_id, params) {
    if (common.empty(user_id)) {
        return 0
    }
    const tag_id = common.empty(params.tag_id) ? 0 : params.tag_id
    const group_id = common.empty(params.group_id) ? 0 : params.group_id
    const keyword = common.empty(params.keyword) ? '' : params.keyword
    const keywords = common.empty(params.keywords) ? '' : params.keywords
    const collection_id = common.empty(params.collection_id) ? 0 : params.collection_id
    const today = common.empty(params.today) ? 0 : params.today
    const share = common.empty(params.share) ? 0 : params.share
    const is_group = common.empty(params.is_group) ? 0 : params.is_group
    const status = common.empty(params.status) ? 0 : params.status
    const note_type = common.empty(params.note_type) ? 1 : params.note_type
    let sort_column = common.empty(params.sort_column) ? 'notes.last_update' : params.sort_column
    let time_column = common.empty(params.orderby_create) ? sort_column : 'notes.created_at'
    const left_join = [], conditions = ['notes.deleted_at is null'], options = []
    let sql = "select count(distinct notes.id) as ts_count from notes #LEFT_JOIN# where #CONDITION#"
    if (!common.empty(tag_id) || !common.empty(group_id)) {
        left_join.push("left join note_tag_relation on note_tag_relation.note_id=notes.id")
        conditions.push("note_tag_relation.deleted_at is null")
    }
    if (!common.empty(tag_id)) {
        conditions.push("note_tag_relation.tag_id=?")
        options.push(tag_id)
    }
    if (!common.empty(group_id)) {
        conditions.push("note_tag_relation.group_id=?")
        options.push(group_id)
    }
    if (!common.empty(params.start_time)) {
        conditions.push(time_column + ">='" + params.start_time + "'")
    }
    if (!common.empty(params.end_time)) {
        conditions.push(time_column + "<='" + params.end_time + " 23:59:59'")
    }
    if (!common.empty(keyword)) {
        conditions.push("notes.content like '%" + keyword + "%'")
    }
    if (!common.empty(keywords)) {
        const like_list = []
        for (const value of keywords) {
            if (common.empty(value)) {
                continue
            }
            like_list.push("notes.content like '%" + value + "%'")
        }
        if (like_list.length > 0) {
            let search_opr = common.empty(params.search_opr) ? 'and' : params.search_opr
            if (search_opr !== 'or') {
                search_opr = 'and'
            }
            conditions.push("(" + like_list.join(search_opr) + ")")
        }
    }
    if (!common.empty(collection_id)) {
        conditions.push("notes.collection_id=?")
        options.push(collection_id)
    } else {
        const join_list = await collectionTool.joinedList(user_id, 'collection_id')
        if (common.empty(join_list)) {
            return []
        }
        conditions.push("notes.collection_id in (" + common.list_column(join_list, 'collection_id').join(',') + ")")
    }
    if (!common.empty(today)) {
        const now = new Date()
        const day_start = common.sd.format(now - 86400000 * 3, 'YYYY-MM-DD HH:mm:ss')
        const day_end = common.sd.format(now, 'YYYY-MM-DD HH:mm:ss')
        conditions.push("notes.created_at>=? and notes.created_at<=?")
        options.push(day_start, day_end)
    }
    if (!common.empty(share)) {
        conditions.push("notes.is_share=?")
        options.push(share)
    }
    if (is_group === 1) {
        conditions.push("notes.user_id=?")
        options.push(user_id)
    }
    if (status !== 2) {
        conditions.push("notes.status=?")
        conditions.push("notes.deleted_at is null")
        options.push(status)
    }
    if (note_type > 0) {
        conditions.push("notes.note_type=?")
        options.push(note_type)
    }
    sql = sql.replace('#LEFT_JOIN#', left_join.join(' '))
    sql = sql.replace('#CONDITION#', conditions.join(' and '))
    const row = await sqlite.get(sql, options);
    if (!common.empty(row) && !common.empty(row.ts_count)) {
        return row.ts_count
    }
    return 0
}

/**
 * 日历计数
 * @param user_id
 * @param params
 * @returns {Promise<number>}
 */
exports.calendarCount = async function (user_id, params) {
    const from_time = common.empty(params.from_time) ? '' : params.from_time
    const end_time = common.empty(params.end_time) ? '' : params.end_time
    const month = common.empty(params.month) ? '' : params.month
    if (common.empty(user_id)) {
        return 0
    }
    const note_type = common.empty(params.note_type) ? 1 : params.note_type
    let sort_column = common.empty(params.sort_column) ? 'last_update' : params.sort_column
    sort_column = common.empty(params.orderby_create) ? sort_column : 'created_at'
    const conditions = ['user_id=?', 'status=1', 'deleted_at is null'], options = [user_id]
    let sql = "select strftime('%Y-%m-%d', " + sort_column + ") as create_time, count(id) as ts_count from notes where #CONDITION# group by create_time order by create_time"
    if (!common.empty(from_time)) {
        conditions.push(sort_column + ">='" + from_time + " 00:00:00'")
    }
    if (!common.empty(end_time)) {
        conditions.push(sort_column + "<='" + end_time + " 23:59:59'")
    }
    if (!common.empty(month)) {
        conditions.push("strftime('%Y-%m', " + sort_column + ")='" + month + "'")
    }
    if (!common.empty(note_type)) {
        if (parseInt(note_type) > 0) {
            conditions.push("note_type=?")
            options.push(note_type)
        }
    }
    if (!common.empty(params.collection_id)) {
        conditions.push("collection_id=?")
        options.push(params.collection_id)
    }
    sql = sql.replace('#CONDITION#', conditions.join(' and '))
    return await sqlite.all(sql, options);
}

/**
 * note关联的批注列表
 * postil_id使用引用的note记录ID
 * @param note_id
 * @param columns
 * @returns {Promise<Array>}
 */
exports.postils = async function (note_id, columns = '*') {
    let sql = 'select #COLUMN# from note_postil where postil_id=? and deleted_at is null'.replace('#COLUMN#', columns)
    const rows = await sqlite.all(sql, [note_id]);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * note引用 note_id 为原笔记的ID，postil_id 为新笔记的ID
 * @param note_id
 * @param postil_id
 * @returns {Promise<*>}
 */
exports.postil = async function (note_id, postil_id) {
    const list = await this.postils(postil_id, 'note_id')
    const quote = list.map((item) => {return item.note_id})
    if (quote.indexOf(note_id) === -1) {
        const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        const sql = "INSERT INTO note_postil(note_id, postil_id, created_at, updated_at) VALUES (?, ?, ?, ?)"
        return await sqlite.insert(sql, [note_id, postil_id, save_time, save_time])
    }
    return 0
}

/**
 * 迁移引用
 * @param id
 * @param target_id
 * @returns {Promise<any>}
 */
exports.movePostil = async function (id, target_id) {
    const sql = "update note_postil set postil_id=? where id=?"
    return await sqlite.update(sql, [target_id, id]);
}

/**
 * 删除引用
 * @param note_id
 * @param postil_id
 * @returns {Promise<any>}
 */
exports.removePostil = async function (note_id, postil_id = 0) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const where = ["note_id=?"]
    const options = [save_time, note_id]
    if (!common.empty(postil_id)) {
        where.push("postil_id=?")
        options.push(postil_id)
    }
    const sql = "update note_postil set deleted_at=? where #WHERE#".replace('#DELETE_TIME#', save_time).replace('#WHERE#', where.join(' and '))
    return await sqlite.update(sql, options)
}

/**
 * note 通用编码加密
 * @param note
 * @returns {*}
 */
exports.encode = function (note) {
    if (common.empty(note)) {
        return note
    }
    if (note.hasOwnProperty('id')) {
        note.id = common.encode(note.id)
    }
    if (note.hasOwnProperty('remote_id')) {
        note.remote_id = common.empty(note.remote_id) ? '' :common.encode(note.remote_id)
    }
    if (note.hasOwnProperty('note_id')) {
        note.note_id = common.encode(note.note_id)
    }
    if (note.hasOwnProperty('todo_id')) {
        delete(note.todo_id)
    }
    if (note.hasOwnProperty('deleted_at')) {
        delete(note.deleted_at)
    }
    if (note.hasOwnProperty('collection_id')) {
        note.collection_id = common.encode(note.collection_id)
    }
    if (note.hasOwnProperty('user_id')) {
        delete(note.user_id)
    }
    if (note.hasOwnProperty('status')) {
        delete(note.status)
    }
    if (note.hasOwnProperty('user_avatar')) {
        note.user_avatar = env.SOURCE_DOMAIN + '/' + note.user_avatar
    }
    // if (note.hasOwnProperty('note_type')) {
    //     delete(note.note_type)
    // }
    if (note.hasOwnProperty('last_update')) {
        note.updated_at = note.last_update
    }
    if (note.hasOwnProperty('note')) {
        // note['note_strip'] = strip_tags(note['note'])
    }
    return note
}

/**
 * note历史列表
 * @param note_id
 * @param days
 * @param use_limit
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<Array>}
 */
exports.histories = async function (note_id, days, use_limit = 1, page = 1, size = 20, columns = 'id,edit_time,former_note') {
    let sql = 'select #COLUMN# from note_history where #WHERE# and deleted_at is null order by edit_time desc';
    const where = ['note_id=?', "JULIANDAY('now') - JULIANDAY(date(edit_time))<=?"]
    const options = [note_id, days]
    sql = sql.replace('#COLUMN#', columns).replace('#WHERE#', where.join(' and '));
    if (!common.empty(use_limit)) {
        sql = sql + " limit ? offset ?"
        options.push(size, common.getPageOffset(page, size))
    }
    const rows = await sqlite.all(sql, options);
    if (common.empty(rows)) {
        return []
    }
    return rows
}

/**
 * note历史计数
 * @param note_id
 * @param days
 * @returns {Promise<*>}
 */
exports.history_count = async function (note_id, days) {
    const sql = 'select count(*) as ts_count from note_history where note_id=? and JULIANDAY(\'now\') - JULIANDAY(date(edit_time))<=? and deleted_at is null'
    const row = await sqlite.get(sql, [note_id, days]);
    if (!common.empty(row) && row.ts_count > 0) {
        return row.ts_count
    }
    return 0
}

/**
 * 保存历史
 * @param note_id
 * @param type
 * @param sub_type
 * @param note
 * @param save_time
 * @param tag_json
 * @param struct_json
 * @returns {Promise<any>}
 */
exports.history = async function (note_id, type, sub_type, note, save_time, tag_json, struct_json) {
    tag_json = common.empty(tag_json) ? '' : tag_json
    struct_json = common.empty(struct_json) ? '' : struct_json
    const notag_content = common.strip(note)
    const sql = "INSERT INTO note_history(note_id, edit_time, former_note, former_content, opr_type, opr_sub_type, tag_json, struct_tag_json, created_at, updated_at)" +
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [note_id, save_time, note, notag_content, type, sub_type, tag_json, struct_json, save_time, save_time]);
}

/**
 * 获取note历史记录
 * @param id
 * @param columns
 * @returns {Promise<any>}
 */
exports.getHistory = async function (id, columns = '*') {
    const sql = 'select #COLUMN# from note_history where id=? and deleted_at is null'.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [id]);
}

/**
 * note置为无效
 * @param note_id
 * @param save_time
 * @returns {Promise<any>}
 */
exports.remove = async function (note_id, save_time) {
    const sql = "UPDATE notes SET status=0, updated_at=?, last_update=? where id=?"
    return await sqlite.run(sql, [save_time, save_time, note_id])
}

/**
 * 删除note
 * @param note_id
 * @returns {Promise<any>}
 */
exports.delete = async function (note_id) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE notes SET deleted_at=? where id=?"
    return await sqlite.update(sql, [save_time, note_id]);
}

/**
 * 恢复笔记
 * @param note_id
 * @returns {Promise<any>}
 */
exports.restore = async function (note_id) {
    const sql = "UPDATE notes SET status=1 where id=?"
    return await sqlite.run(sql, [note_id])
}

/**
 * 清空用户回收站笔记
 * @param user_id
 * @returns {Promise<any>}
 */
exports.clearTrash = async function (user_id) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const sql = "UPDATE notes SET deleted_at=? where user_id=? and status=0"
    return await sqlite.update(sql, [save_time, user_id]);
}

/**
 * 删除无效引用
 * @param user_id
 * @param note_id
 * @param collection_id
 * @returns {Promise<boolean>}
 */
exports.removeUnablePostil = async function (user_id, note_id, collection_id) {
    const sql = 'select postil.postil_id from note_postil postil\n' +
        'left join notes on postil.note_id=notes.id\n' +
        'left join collections on notes.collection_id=collections.id\n' +
        'where notes.user_id!=? and postil.note_id=? and notes.collection_id!=?\n' +
        'and notes.status=1 and notes.deleted_at is null and collections.deleted_at is null and postil.deleted_at is null'
    const rows = await sqlite.all(sql, [user_id, note_id, collection_id])
    if (common.empty(rows)) {
        return false
    }
    const postil_list = common.list_column(rows, 'postil_id')
    if (postil_list.length === 0) {
        return false
    }
    for (const postil_id of postil_list) {
        await this.removePostil(note_id, postil_id)
    }
    return true
}

/**
 * 获取note记录
 * @param note_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.remote = async function (note_id, columns = '*') {
    let sql = 'select #COLUMN# from notes where remote_id=? and deleted_at is null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [note_id]);
}

/**
 * 获取note记录
 * @param hash_code
 * @param columns
 * @returns {Promise<any>}
 */
exports.getHashNote = async function (hash_code, columns = '*') {
    let sql = 'select #COLUMN# from notes where hash_code=? and deleted_at is null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [hash_code]);
}

/**
 * 获取已删除的note记录
 * @param note_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.remoteDestroyed = async function (note_id, columns = '*') {
    let sql = 'select #COLUMN# from notes where remote_id=? and deleted_at != null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [note_id]);
}

/**
 * 设置远程记录ID
 * @param note_id
 * @param remote_id
 * @returns {Promise<any>}
 */
exports.setRemote = async function (note_id, remote_id) {
    const sql = "UPDATE notes SET remote_id=? WHERE id=?"
    return await sqlite.update(sql, [remote_id, note_id])
}

/**
 * 待推送笔记
 * @param collections
 * @param columns
 * @returns {Promise<Array>}
 */
exports.waitingPushNotes = async function (collections, columns = 'id') {
    if (collections.length === 0) {
        return []
    }
    let sql = 'select #COLUMNS# from notes where collection_id in (#collections#) and remote_id=0'.replace('#collections#', collections.join(',')).replace('#COLUMNS#', columns);
    return await sqlite.all(sql);
}

/**
 * 待推送笔记
 * @param user_id
 * @param collections
 * @param columns
 * @returns {Promise<Array>}
 */
exports.waitingUserPushNotes = async function (user_id, collections, columns = 'id') {
    if (collections.length === 0) {
        return []
    }
    let sql = 'select #COLUMNS# from notes where user_id=#USERID# and collection_id in (#collections#) and remote_id=0'.replace('#USERID#', user_id).replace('#collections#', collections.join(',')).replace('#COLUMNS#', columns);
    return await sqlite.all(sql);
}

/**
 * 待填充无标签内容笔记
 * @param columns
 * @returns {Promise<void>}
 */
exports.waitingFillContentNotes = async function (columns = 'id') {
    let sql = 'select #COLUMNS# from notes where deleted_at is null and content is null'.replace('#COLUMNS#', columns);
    return await sqlite.all(sql);
}

/**
 * 仅获取已与远程同步的notes
 * @param columns
 * @returns {Promise<void>}
 */
exports.onlyRemoteNotes = async function (columns = 'id') {
    let sql = 'select #COLUMNS# from notes where remote_id>0 and deleted_at is null'.replace('#COLUMNS#', columns);
    return await sqlite.all(sql);
}

exports.allErrorNotes = async function () {
    let sql = 'select id,weight,note,content from notes';
    return await sqlite.all(sql);
}

exports.inverseNoteWeightContent = async function (note_id, weight, content) {
    const sql = "UPDATE notes SET weight=?, content=? WHERE id=?"
    return await sqlite.update(sql, [weight, content, note_id])
}

/**
 * 获取全部本用户笔记列表
 * @param user_id
 * @returns {Promise<void>}
 */
exports.allUserNoteList = async function (user_id) {
    const sql = "select id,collection_id from notes where user_id=?"
    return await sqlite.update(sql, [user_id])
}

