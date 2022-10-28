const sqlite = require('./sqlitepool');
const common = require('./common');

/**
 * 获取collection记录
 * @param collection_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.get = async function (collection_id, columns = '*') {
    let sql = 'select #COLUMN# from collections where id=? and deleted_at is null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [collection_id]);
}

/**
 * 获取collection记录
 * @param collection_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.get = async function (collection_id, columns = '*') {
    let sql = 'select #COLUMN# from collections where id=? and deleted_at is null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [collection_id]);
}

/**
 * 获取collection记录
 * @param collection_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.getNoStatus = async function (collection_id, columns = '*') {
    let sql = 'select #COLUMN# from collections where id=?';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [collection_id]);
}

/**
 * 获取collection记录
 * @param collection_id
 * @param columns
 * @returns {Promise<any>}
 */
exports.remote = async function (collection_id, columns = '*') {
    let sql = 'select #COLUMN# from collections where remote_id=? and deleted_at is null';
    sql = sql.replace('#COLUMN#', columns)
    return await sqlite.get(sql, [collection_id]);
}

/**
 * 创建collection
 * @param user_id
 * @param collection
 * @param color
 * @param save_time
 * @param parent_id
 * @param assign_user_id
 * @returns {Promise<*>}
 */
exports.create = async function (user_id, collection, color, save_time, parent_id = 0, assign_user_id = 1) {
    if (common.empty(collection)) {
        return 0;
    }
    if (common.empty(color)) {
        color = '#f58220';
    }
    if (common.empty(parent_id)) {
        parent_id = 0;
    }
    const hash = common.md5(JSON.stringify({collection, create_time: save_time}))
    let sql = "INSERT INTO collections(user_id, remote_id, collection, color, parent_id, assign_user_id, hash_code, created_at, updated_at) VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [user_id, collection, color, parent_id, assign_user_id, hash, save_time, save_time]);
}

/**
 * 创建collection
 * @param user_id
 * @param remote_id
 * @param collection
 * @param color
 * @param save_time
 * @param parent_id
 * @returns {Promise<*>}
 */
exports.createRemote = async function (user_id, remote_id, collection, color, save_time, parent_id = 0) {
    if (common.empty(collection)) {
        return 0;
    }
    if (common.empty(remote_id)) {
        return 0;
    }
    if (common.empty(color)) {
        color = '#f58220';
    }
    if (common.empty(parent_id)) {
        parent_id = 0;
    }
    const hash = common.md5(JSON.stringify({collection, create_time: save_time}))
    let sql = "INSERT INTO collections(user_id, remote_id, collection, color, parent_id, hash_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    return await sqlite.insert(sql, [user_id, remote_id, collection, color, parent_id, hash, save_time, save_time]);
}

/**
 * 编辑collection
 * @param collection_id
 * @param collection
 * @param color
 * @param save_time
 * @param parent_id
 * @returns {Promise<*>}
 */
exports.edit = async function (collection_id, collection, color, save_time, parent_id = 0) {
    if (common.empty(collection_id) || common.empty(collection)) {
        return 0;
    }
    if (common.empty(parent_id)) {
        parent_id = 0;
    }
    const columns = ["collection=?" , "parent_id=?", "updated_at=?"]
    const params = [collection, parent_id, save_time]
    if (!common.empty(color)) {
        columns.push("color=?")
        params.push(color)
    }
    const sql = "UPDATE collections SET " + columns.join(',') + " WHERE id=" + collection_id
    return await sqlite.update(sql, params)
}

/**
 * 设置远程记录ID
 * @param collection_id
 * @param remote_id
 * @returns {Promise<any>}
 */
exports.setRemote = async function (collection_id, remote_id) {
    const sql = "UPDATE collections SET remote_id=? WHERE id=?"
    return await sqlite.update(sql, [remote_id, collection_id])
}

/**
 * 设置是否 未 第一次激活下行
 * @param collection_id
 * @param assign_user_id
 * @returns {Promise<any>}
 */
exports.setAssignUserId = async function (collection_id, assign_user_id) {
    const sql = "UPDATE collections SET assign_user_id=? WHERE id=?"
    return await sqlite.update(sql, [assign_user_id, collection_id])
}

/**
 * collection成员列表
 * @param user_id
 * @param collection_id
 * @returns {Promise<Array>}
 */
exports.members = async function (user_id, collection_id) {
    const members = [];
    let sql = "select DISTINCT joined.user_id, u.name, u.avatar from user_join_collections joined left join users u on joined.user_id=u.remote_id " +
        "where joined.status=1 and joined.collection_id=?"
    const list = await sqlite.all(sql, [collection_id])
    if (common.empty(list)) {
        return members
    }
    list.forEach(function (item) {
        members.push({
            name: item.name,
            id: common.encode(item.user_id),
            avatar: item.avatar,
            is_self: user_id === item.user_id ? 1 : 0
        })
    })
    return members
}

/**
 * 加入collection
 * @param user_id
 * @param collection_id
 * @param save_time
 * @returns {Promise<*>}
 */
exports.join = async function (user_id, collection_id, save_time) {
    if (common.empty(user_id) || common.empty(collection_id)) {
        return 0
    }
    const sql = "REPLACE INTO user_join_collections(user_id, collection_id, status, created_at, updated_at) VALUES (?, ?, 1, ?, ?)"
    return await sqlite.run(sql, [user_id, collection_id, save_time, save_time])
    // let sql = "select * from user_join_collections where user_id=? and collection_id=?"
    // const row = await sqlite.get(sql, [user_id, collection_id]);
    // if (common.empty(row)) {
    //     sql = "INSERT INTO user_join_collections(user_id, collection_id, status, created_at, updated_at) VALUES (?, ?, 1, ?, ?)"
    //     return await sqlite.run(sql, [user_id, collection_id, save_time, save_time])
    // }
    // if (row.status === 0 || row.status === 2) {
    //     sql = "UPDATE user_join_collections SET status=1, updated_at=? WHERE id=?"
    //     await sqlite.update(sql, [save_time, row.id]);
    // }
    // return row.id;
}

/**
 * 成员移除团队
 * @param user_id
 * @param collection_id
 * @returns {Promise<void>}
 */
exports.shiftout = async function (user_id, collection_id) {
    const sql = "UPDATE user_join_collections SET status=0 where user_id=? and collection_id=?"
    await sqlite.update(sql, [user_id, collection_id])
}

/**
 * 用户参与的collection关联列表
 * @param user_id
 * @param columns
 * @returns {Promise<*>}
 */
exports.joinedList = async function (user_id, columns = '*') {
    if (common.empty(user_id)) {
        return [];
    }
    let sql = "select #COLUMNS# from user_join_collections where status=1 and user_id=?"
    sql = sql.replace('#COLUMNS#', columns);
    return await sqlite.all(sql, [user_id])
}

/**
 * 是否已加入团队
 * @param user_id
 * @param collection_id
 * @returns {Promise<boolean>}
 */
exports.isJoined = async function (user_id, collection_id) {
    if (common.empty(user_id) || common.empty(collection_id)) {
        return false
    }
    let sql = "select user_id, collection_id from user_join_collections where status=1 and user_id=? and collection_id=?"
    const row = await sqlite.get(sql, [user_id, collection_id])
    if (!common.empty(row)) {
        return true
    }
    return false
}

/**
 * 获取collection列表
 * @param user_id
 * @param joined_list
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<*>}
 */
exports.collections = async function (user_id, joined_list, page, size, columns) {
    if (common.empty(user_id)) {
        return [];
    }
    let sql = "select #COLUMNS# from collections left join user_collection_indexes indexes on collections.id=indexes.collection_id" +
        " where indexes.user_id=? and indexes.collection_id in (" + joined_list + ") and collections.deleted_at is null order by indexes.sort_index limit ? offset ?"
    sql = sql.replace('#COLUMNS#', columns).replace('#USERID#', user_id)
        .replace('#JOINED_LIST#', joined_list).replace('#SIZE#', size).replace('#OFFSET#', common.getPageOffset(page, size));
    return await sqlite.all(sql, [user_id, size, common.getPageOffset(page, size)])
}

/**
 * 获取collection列表
 * @param join_list
 * @param status
 * @param columns
 * @returns {Promise<any>}
 */
exports.list = async function (join_list, status = 1, columns = '*') {
    const conditions = ['id in (' + join_list + ')']
    let sql = "select #COLUMNS# from collections where #CONDITION#".replace('#COLUMNS#', columns)
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
 * 排序collection
 * @param user_id
 * @param collection_id
 * @param save_time
 * @returns {Promise<*>}
 */
exports.sort = async function (user_id, collection_id, save_time) {
    if (common.empty(user_id) || common.empty(collection_id)) {
        return 0;
    }
    let sql = "select MAX(sort_index) as max_sort from user_collection_indexes where user_id=?"
    const count_row = await sqlite.get(sql, [user_id])
    let max_sort = 1
    if (!common.empty(count_row) && count_row.max_sort !== null) {
        max_sort = count_row.max_sort + 1
    }
    sql = "REPLACE INTO user_collection_indexes(user_id, collection_id, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    return await sqlite.run(sql, [user_id, collection_id, max_sort, save_time, save_time])
    // sql = "select id from user_collection_indexes where user_id=? and collection_id=?"
    // const row = await sqlite.get(sql, [user_id, collection_id])
    // if (!common.empty(row)) {
    //     return row.id
    // }
    // sql = "INSERT INTO user_collection_indexes(user_id, collection_id, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    // return await sqlite.insert(sql, [user_id, collection_id, max_sort, save_time, save_time])
}

/**
 * 重新排序collection
 * @param user_id
 * @param collection_id
 * @param sort_index
 * @param save_time
 * @returns {Promise<*>}
 */
exports.resort = async function (user_id, collection_id, sort_index, save_time) {
    const sql = "REPLACE INTO user_collection_indexes(user_id, collection_id, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    return await sqlite.run(sql, [user_id, collection_id, sort_index, save_time, save_time])
    // let sql = "select id from user_collection_indexes where user_id=? and collection_id=?"
    // const row = await sqlite.get(sql, [user_id, collection_id])
    // if (common.empty(row)) {
    //     sql = "INSERT INTO user_collection_indexes(user_id, collection_id, sort_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    //     return await sqlite.run(sql, [user_id, collection_id, sort_index, save_time, save_time])
    // }
    // sql = "UPDATE user_collection_indexes SET sort_index=?, updated_at=? WHERE id=?"
    // return await sqlite.update(sql, [sort_index, save_time, row.id])
}

/**
 * 清空collection排序
 * @param user_id
 * @returns {Promise<void>}
 */
exports.clearIndex = async function (user_id) {
    await sqlite.delete('user_collection_indexes', 'user_id=' +  user_id)
}

/**
 * 用户自定义排序
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.userIndex = async function (user_id, collection_id) {
    const sql = "select id, sort_index from user_collection_indexes where user_id=? and collection_id=?"
    const record = await sqlite.get(sql, [user_id, collection_id])
    if (common.empty(record)) {
        return {relate: null, sort_index: 0}
    }
    return {relate: record, sort_index: record.sort_index}
}

/**
 * 获取用户collection数量
 * @param user_id
 * @returns {Promise<number>}
 */
exports.collectCount = async function (user_id) {
    let sql = "select COUNT(*) as collection_count from collections where user_id=?"
    const row = await sqlite.get(sql, [user_id]);
    let collection_count = 0;
    if (!common.empty(row) && !common.empty(row.collection_count)) {
        collection_count = row.collection_count
    }
    return collection_count
}

/**
 * collection用户统计
 * @param collection_id
 * @returns {Promise<number>}
 */
exports.collectionUserCount = async function (collection_id) {
    let sql = "select COUNT(*) as user_count from user_join_collections where status=1 and  collection_id=?"
    const row = await sqlite.get(sql, [collection_id])
    let user_count = 0
    if (!common.empty(row) && !common.empty(row.user_count)) {
        user_count = row.user_count
    }
    return user_count
}

/**
 * collection关键字段加密
 * @param collection
 * @returns {*}
 */
exports.encode = function (collection) {
    if (common.empty(collection)) {
        return collection
    }
    if (collection.hasOwnProperty('id')) {
        collection.id = common.encode(collection.id)
    }
    if (collection.hasOwnProperty('user_id')) {
        collection.user_id = common.encode(collection.user_id)
    }
    return collection
}

/**
 * 删除笔记本
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.remove = async function (collection_id) {
    if (!common.empty(collection_id)) {
        const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        let sql = "update collections set deleted_at=? where id=? and deleted_at is null"
        return await sqlite.update(sql, [save_time, collection_id]);
    }
    return 0
}

/**
 * 修改笔记本修改时间
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.editUpdateAt = async function (collection_id) {
    if (!common.empty(collection_id)) {
        const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        let sql = "update collections set updated_at=? where id=? and deleted_at is null"
        return await sqlite.update(sql, [save_time, collection_id]);
    }
    return 0
}

/**
 * 获取is_group
 * @param user_id
 * @param collection_id
 * @returns {Promise<*>}
 */
exports.getIsGroup = async function (user_id, collection_id) {
    let is_group = 1
    let collection = {}
    if (!common.empty(collection_id)) {
        // 团队笔记校验
        const members = await this.members(user_id, collection_id)
        if (!common.empty(members) && members.length > 1) {
            is_group = 2
        }
        collection = await this.get(collection_id)
        if (common.empty(collection)) {
            return {status: false, message: 'collection无效', collection, is_group}
        }
        if (is_group === 1 && collection.user_id !== user_id) {
            // 非团队版需要验证用户所有权
            return {status: false, message: '权限错误，无权访问!', collection, is_group}
        }
    }
    if (is_group === 2) {
        const joined = await this.isJoined(user_id, collection_id)
        if (!joined) {
            return {status: false, message: '权限错误，未加入团队笔记', collection, is_group}
        }
    }
    return {status: true, message: '', collection, is_group}
}

