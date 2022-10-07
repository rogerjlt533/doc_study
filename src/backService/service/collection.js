const common = require('../tool/common');
const collectionTool = require('../tool/collection');
const noteTool = require('../tool/note')
const sd = require('silly-datetime');

exports.collectionTool = collectionTool

/**
 * 创建collection
 * @param user_id
 * @param collection
 * @param color
 * @param parent_id
 * @returns {Promise<number>}
 */
exports.create = async function (user_id, collection, color, parent_id = 0) {
    const save_time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    const collection_id = await collectionTool.create(user_id, collection, color, save_time, parent_id);
    if (common.empty(collection_id)) {
        return 0;
    }
    await collectionTool.join(user_id, collection_id, save_time);
    await collectionTool.sort(user_id, collection_id, save_time);
    return collection_id;
}

/**
 * collection成员列表信息
 * @param user_id
 * @param collection_id
 * @returns {Promise<{members: Array, is_self: number, is_team: number}>}
 */
exports.memberList = async function (user_id, collection_id) {
    let is_self = 0, is_team = 0, members = [], hash_code = '';
    const collection = await collectionTool.get(collection_id);
    if (common.empty(collection)) {
        return {is_self, is_team, members, hash_code}
    }
    hash_code = collection.hash_code
    if (collection.user_id === user_id) {
        is_self = 1;
    }
    members = await collectionTool.members(user_id, collection_id);
    if (members.length > 1) {
        is_team = 1;
    }
    return {is_self, is_team, members, hash_code}
}

/**
 * 我的collection列表
 * @param user_id
 * @param page
 * @param size
 * @param columns
 * @returns {Promise<{self_list, team_list}>}
 */
exports.mine = async function (user_id, page, size, columns = ['id', 'collection', 'color']) {
    let self_list = [], team_list = []
    let joinedList = await collectionTool.joinedList(user_id, 'collection_id')
    if (common.empty(joinedList)) {
        return {self_list, team_list}
    }
    if (joinedList.length === 0) {
        return {self_list, team_list}
    }
    joinedList = joinedList.map((item) => {
        return item.collection_id
    }).join(',')
    columns = columns.map((item) => {
        return 'collections.' + item
    }).join(',')
    const collections = await collectionTool.collections(user_id, joinedList, page, size, columns)
    if (common.empty(collections)) {
        return {self_list, team_list}
    }
    if (collections.length === 0) {
        return {self_list, team_list}
    }
    for (const index in collections) {
        const data = await this.memberList(user_id, collections[index].id)
        collections[index] = Object.assign(collections[index], data)
        collections[index] = collectionTool.encode(collections[index])
        if (data.members.length > 1) {
            team_list.push(collections[index])
        } else {
            self_list.push(collections[index])
        }
    }
    return {self_list, team_list}
}

/**
 * collection id分组
 * @param collection_ids
 * @returns {Promise<{self_list: Array, team_list: Array}>}
 */
exports.group = async function (collection_ids) {
    let self_list = [], team_list = []
    for (const index in collection_ids) {
        const user_count = await collectionTool.collectionUserCount(collection_ids[index])
        if (user_count > 1) {
            team_list.push(collection_ids[index])
        } else {
            self_list.push(collection_ids[index])
        }
    }
    return {self_list, team_list}
}

/**
 * 备份笔记
 * @param user_id
 * @param collection
 * @param notes
 * @returns {Promise<void>}
 */
exports.backupNotes = async function (user_id, collection, notes) {
    const collection_id = await this.create(user_id, collection.collection, collection.color, collection.parent_id)
    for (const note of notes) {
        const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        await noteTool.history(note.id, 3, 3001, note.note, save_time, note.tag_json, note.struct_tag_json)
        await noteTool.changeCollection(note, collection_id)
        const postils = await noteTool.postils(note.id, 'id,note_id')
        for (const postil of postils) {
            const postil_note = await noteTool.get(postil.note_id, 'id,user_id')
            if (postil_note.user_id !== user_id) {
                await noteTool.removePostil(postil.note_id, note.id)
            }
        }
    }
}

/**
 * 清空笔记本笔记
 * @param user_id
 * @param collection
 * @returns {Promise<boolean>}
 */
exports.clearNotes = async function (user_id, collection) {
    const notes = await noteTool.collectionStatusNotes(collection.id, [0,1],  '*')
    if (notes.length === 0) {
        return false
    }
    const waiting_list = {}
    for (const note of notes) {
        if (note.user_id === user_id) {
            // const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
            // await noteTool.history(note.id, 3, 3001, note.note, save_time, note.tag_json, note.struct_tag_json)
            await noteTool.delete(note.id)
            await noteTool.removePostil(note.id)
        } else {
            if (!waiting_list.hasOwnProperty(note.user_id)) {
                waiting_list[note.user_id] = []
            }
            waiting_list[note.user_id].push(note)
        }
    }
    for (const user_id in waiting_list) {
        await this.backupNotes(user_id, collection, waiting_list[user_id])
    }
    return true
}

/**
 * 迁移collection
 * @param user_id
 * @param target_id
 * @param source_id
 * @returns {Promise<boolean>}
 */
exports.moveNotes = async function (user_id, target_id, source_id) {
    const collection = await collectionTool.get(source_id)
    const notes = await noteTool.collectionStatusNotes(source_id, [0,1], '*')
    if (notes.length === 0) {
        return false
    }
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const waiting_list = {}
    for (const note of notes) {
        if (note.user_id === user_id) {
            await noteTool.history(note.id, 3, 3001, note.note, save_time, note.tag_json, note.struct_tag_json)
            await noteTool.changeCollection(note, target_id)
            const postils = await noteTool.postils(note.id, 'id,note_id')
            for (const postil of postils) {
                const postil_note = await noteTool.get(postil.note_id, 'id,user_id')
                if (postil_note.user_id !== user_id) {
                    await noteTool.removePostil(postil.note_id, note.id)
                }
            }
        } else {
            if (!waiting_list.hasOwnProperty(note.user_id)) {
                waiting_list[note.user_id] = []
            }
            waiting_list[note.user_id].push(note)
        }
    }
    for (const user_id in waiting_list) {
        await this.backupNotes(user_id, collection, waiting_list[user_id])
    }
    return true
}

/**
 * 全部
 * @param user_id
 * @param columns
 * @returns {Promise<*>}
 */
exports.all = async function (user_id, columns = '*') {
    let joinedList = await collectionTool.joinedList(user_id, 'collection_id')
    if (common.empty(joinedList) || joinedList.length === 0) {
        return []
    }
    joinedList = joinedList.map((item) => {
        return item.collection_id
    }).join(',')
    const collections = await collectionTool.list(joinedList, 2, columns)
    if (common.empty(collections) || collections.length === 0) {
        return []
    }
    return collections
}



