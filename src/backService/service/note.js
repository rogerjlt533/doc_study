const common = require('../tool/common');
const collectionTool = require('../tool/collection')
const noteTool = require('../tool/note')
const tagTool = require('../tool/tag')
const userTool = require('../tool/user')
const httpTool = require('../tool/http')

exports.noteTool = noteTool

/**
 * 绑定note标签
 * @param user_id
 * @param note_id
 * @param tag_list
 * @returns {Promise<Array>}
 */
exports.bindTags = async function (user_id, note_id, tag_list = []) {
    tag_list = common.empty(tag_list) ? [] : tag_list
    const list = []
    for (let tag of tag_list) {
        if (common.empty(tag) || tag === '') {
            continue
        }
        tag = tag.replace("-", '/')
        const items = tag.split('/')
        if (items.length === 1) {
            // 非分组标签绑定
            const record = await tagTool.findByTag(user_id, tag)
            if (!common.empty(record)) {
                const relate_id = await tagTool.bindNote(note_id, record.id, 0)
                if (relate_id > 0) {
                    list.push(relate_id)
                } else {
                    const relate = await tagTool.findNoteRelation(note_id, record.id, 0)
                    if (!common.empty(relate)) {
                        list.push(relate.id)
                    }
                }
                continue
            }
            const tag_id = await tagTool.create(user_id, tag)
            if (common.empty(tag_id)) {
                continue
            }
            const relate_id = await tagTool.bindNote(note_id, tag_id, 0)
            if (relate_id > 0) {
                list.push(relate_id)
            } else {
                const relate = await tagTool.findNoteRelation(note_id, tag_id, 0)
                if (!common.empty(relate)) {
                    list.push(relate.id)
                }
            }
        } else if (items.length > 1) {
            const group_name = items[0]
            const {group_id, tag_id} = await tagTool.createGroup(user_id, group_name)
            for (const index in items) {
                const value = items[index]
                const item_tag = await tagTool.findByTag(user_id, value)
                let item_id = 0
                if (common.empty(item_tag)) {
                    item_id = await tagTool.create(user_id, value)
                } else {
                    item_id = item_tag.id
                }
                if (common.empty(item_id)) {
                    continue
                }
                await tagTool.initGroupItem(user_id, group_id, item_id)
                const relate_id = await tagTool.bindNote(note_id, item_id, common.empty(group_id) ? 0 : tag_id)
                if (relate_id > 0) {
                    list.push(relate_id)
                } else {
                    const relate = await tagTool.findNoteRelation(note_id, item_id, common.empty(group_id) ? 0 : tag_id)
                    if (!common.empty(relate)) {
                        list.push(relate.id)
                    }
                }
            }
        }
    }
    return list
}

/**
 * 绑定结构化标签
 * @param user_id
 * @param note_id
 * @param struct_list
 * @returns {Promise<{list_item: Array, list: Array}>}
 */
exports.bindStructTags = async function (user_id, note_id, struct_list = []) {
    struct_list = common.empty(struct_list) ? [] : struct_list
    let list = [], list_item = []
    for (const index in struct_list) {
        const circle_res = await this.circleStructTree(user_id, note_id, index, struct_list[index], 0, list, list_item)
        list = circle_res.list
        list_item = circle_res.list_item
    }
    return {list, list_item}
}

/**
 * 递归处理结构化标签组
 * @param user_id
 * @param note_id
 * @param sort_index
 * @param item
 * @param parent_node
 * @param list
 * @param list_item
 * @returns {Promise<{list_item: Array, list: Array}>}
 */
exports.circleStructTree = async function (user_id, note_id, sort_index, item, parent_node, list = [], list_item = []) {
    const save_time = common.sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const tag_list = []
    list = common.empty(list) ? [] : list
    list_item = common.empty(list_item) ? [] : list_item
    const is_header = item.level > 0 ? 1 : 0
    const node_id = await tagTool.addNoteTagNode(note_id, item.tag, is_header, parent_node, sort_index, save_time)
    list.push(node_id)
    let needItemNode = 0
    if (is_header > 0) {
        common.list_column(item.tag.concat(" ").matchAll(/\#(\S+?)?\s{1}/g), 1).forEach(function (value) {
            if (!common.empty(value)) {
                tag_list.push(value)
            }
        })
        for (const index in item.data) {
            const unit = item.data[index]
            if (unit.level > 0) {
                const circle_res = await this.circleStructTree(user_id, note_id, index, unit, node_id, list, list_item)
                list = circle_res.list
                list_item = circle_res.list_item
            } else {
                needItemNode = 1
                tag_list.push(unit.tag)
            }
        }
    } else {
        needItemNode = 1
        tag_list.push(item.tag)
    }
    for (const index in tag_list) {
        const tag = tag_list[index].replace("-", '/')
        const items = tag.split('/')
        if (items.length === 1) {
            if (common.empty(tag) || tag === '') {
                continue
            }
            list_item = await this.addNoteTagNodeItem(user_id, note_id, node_id, tag, index, index, needItemNode, save_time, list_item)
        } else {
            for (const vindex in items) {
                if (common.empty(items[vindex]) || items[vindex] === '') {
                    continue
                }
                list_item = await this.addNoteTagNodeItem(user_id, note_id, node_id, items[vindex], index, vindex, needItemNode, save_time, list_item)
            }
        }
    }
    return {list, list_item}
}

/**
 * 添加节点明细
 * @param user_id
 * @param note_id
 * @param node_id
 * @param tag
 * @param index
 * @param item_index
 * @param needItemNode
 * @param save_time
 * @param list_item
 * @returns {Promise<*>}
 */
exports.addNoteTagNodeItem = async function (user_id, note_id, node_id, tag, index, item_index, needItemNode, save_time, list_item) {
    const item_tag = await tagTool.findByTag(user_id, tag)
    let item_id = 0
    if (common.empty(item_tag)) {
        item_id = await tagTool.create(user_id, tag)
    } else {
        item_id = item_tag.id
    }
    if (common.empty(item_id)) {
        return list_item
    }
    if (needItemNode === 1) {
        const item_node = await tagTool.addNoteTagNode(note_id, tag, 0, node_id, index, save_time)
        const node_itemid = await tagTool.addNoteTagNodeItem(note_id, item_node, item_id, item_index, save_time)
        list_item.push(node_itemid)
    } else {
        const node_itemid = await tagTool.addNoteTagNodeItem(note_id, node_id, item_id, item_index, save_time)
        list_item.push(node_itemid)
    }
    return list_item
}

/**
 * 用户note列表
 * @param user_id
 * @param params
 * @param sort
 * @param page
 * @param size
 * @returns {Promise<*>}
 */
exports.userNotes = async function (user_id, params, sort = 'desc', page = 1, size = 20) {
    let notes = await noteTool.notes(user_id, params, sort, page, size)
    if (notes.length === 0) {
        return notes
    }
    const count = await noteTool.count(user_id, params)
    let collection_list = {}, user_list = {}
    const note_list = []
    for (let note of notes) {
        note.tag_id = note.tag = note.tags = []
        const tag_list = await tagTool.noteTags(note.id)
        note.tags = tag_list
        tag_list.forEach( (item) => {
            item.id = common.encode(item.id)
            note.tag_id.push(item.id)
            note.tag.push(item.tag)
        })
        note.tag_id = note.tag_id.join(',')
        note.tag = note.tag.join(',')
        note.updated_time = common.empty(note.last_update) ? note.updated_at : note.last_update
        const relation_res = await this.noteRelation(note, user_id, collection_list)
        collection_list = relation_res.collection_list
        if (common.empty(relation_res.note)) {
            continue
        }
        note = await this.noteQuote(relation_res.note)
        const auth_res = await this.noteAuthor(note, user_id, user_list)
        user_list = auth_res.user_list
        note = noteTool.encode(auth_res.note)
        note_list.push(note)
    }
    return {note: note_list, count}
}

/**
 * 日历笔记计数
 * @param user_id
 * @param params
 * @returns {Promise<Array>}
 */
exports.calendarNoteCount = async function (user_id, params) {
    let notes = await noteTool.calendarCount(user_id, params)
    console.log("notes",notes)
    const data = []
    for (const note of notes) {
        data.push([note.create_time, note.ts_count])
    }
    return data
}

/**
 * note关联对象
 * @param note
 * @param user_id
 * @param collection_list
 * @returns {Promise<*>}
 */
exports.noteRelation = async function (note, user_id, collection_list = {}) {
    if (common.empty(note)) {
        return {note, collection_list}
    }
    if (!note.hasOwnProperty('tags')) {
        const tag_list = await tagTool.noteTags(note.id)
        note.tags = tag_list.map((item) => {
            item.id = common.encode(item.id)
            return item
        })
    }
    if (!note.hasOwnProperty('collection')) {
        if (!collection_list.hasOwnProperty(note.collection_id)) {
            const collection = await collectionTool.get(note.collection_id, 'collection,color,user_id')
            if (common.empty(collection)) {
                return {note: null, collection_list}
            }
            collection_list[note.collection_id] = collection
        }
        const collection_info = JSON.stringify(collection_list[note.collection_id])
        note.collection = JSON.parse(collection_info)
        if (!common.empty(user_id) && note.collection.user_id !== user_id) {
            note.collection.is_team = 1
        } else {
            note.collection.is_team = 0
        }
        delete(note.collection.user_id)
    }
    return {note, collection_list}
}

/**
 * note 引用
 * @param note
 * @returns {Promise<*>}
 */
exports.noteQuote = async function (note) {
    note.quote = []
    const postils = await noteTool.postils(note.id)
    if (postils.length === 0) {
        return note
    }
    for (const index in postils) {
        const quote = postils[index]
        const postil_note = await noteTool.get(quote.note_id, 'id,user_id,note')
        if (common.empty(postil_note)) {
            continue
        }
        const quote_user = await userTool.get(postil_note.user_id, 'name,avatar')
        postil_note.user_name = common.empty(quote_user) ? '' : quote_user.name
        postil_note.user_avatar = common.empty(quote_user) ? '' : quote_user.avatar
        postil_note.id = common.encode(postil_note.id)
        note.quote.push(postil_note)
    }
    return note
}

/**
 * note作者信息
 * @param note
 * @param user_id
 * @param user_list
 * @returns {Promise<{note: *, user_list}>}
 */
exports.noteAuthor = async function (note, user_id, user_list = {}) {
    note.is_self = note.user_id === user_id ? 1 : 2
    if (!user_list.hasOwnProperty(note.user_id)) {
        const author = await userTool.get(note.user_id, 'name,avatar')
        if (!common.empty(author)) {
            user_list[note.user_id] = author
        }
    }
    note.author = user_list.hasOwnProperty(note.user_id) ? user_list[note.user_id].name : ''
    note.avatar = user_list.hasOwnProperty(note.user_id) ? user_list[note.user_id].avatar : ''
    return {note, user_list}
}

/**
 * note基础详情
 * @param user_id
 * @param note_id
 * @returns {Promise<*>}
 */
exports.info = async function (user_id, note_id) {
    let list = [], count = 0
    if (common.empty(note_id)) {
        return {status: 0, message: '缺少参数', note: null, history: {list, count}}
    }
    const columns = ['id', 'user_id', 'collection_id', 'note', 'note_type', 'source', 'is_share', 'share_code', 'created_at', 'last_update', 'updated_at', 'status', 'url']
    let note = await noteTool.get(note_id, columns.join(','))
    if (common.empty(note)) {
        return {status: 0, message: '记录无效', note: null, history: {list, count}}
    }
    const isJoined = await collectionTool.isJoined(user_id, note.collection_id)
    if (!isJoined) {
        return {status: 0, message: '无权访问', note: null, history: {list, count}}
    }
    note.is_self = user_id === note.user_id ? 1 : 0
    note = await this.noteQuote(note)
    const relation_res = await this.noteRelation(note, user_id)
    if (common.empty(relation_res.note)) {
        return {status: 0, message: '笔记本无效', note: null, history: {list, count}}
    }
    note = relation_res.note
    const author_res = await this.noteAuthor(note, user_id)
    note = noteTool.encode(author_res.note)
    note.updated_time = note.updated_at
    return {status: 1, message: '', note, history: {list, count}}
}

/**
 * 合并引用
 * @param target_id
 * @param source_id
 * @returns {Promise<void>}
 */
exports.mergePostil = async function (target_id, source_id) {
    let target_list = await noteTool.postils(target_id, 'note_id')
    target_list = common.list_column(target_list, 'note_id')
    const source_list = await noteTool.postils(source_id, 'id,note_id,postil_id')
    for (const item of source_list) {
        if (target_list.indexOf(item.note_id) !== -1) {
            // 已存在进行删除
            await noteTool.removePostil(item.note_id, item.postil_id)
        } else {
            if (item.note_id === target_id) {
                // 自身引用删除
                await noteTool.removePostil(item.note_id, item.postil_id)
            } else {
                // 非自身进行迁移
                await noteTool.movePostil(item.id, target_id)
            }
        }
    }
}

exports.importFlomo = async function (user_id, memo) {
    // {
    //     status: true,
    //         dirname: 'C:\\workspace\\zhimo\\node_sqlite\\resource\\temp\\flomo/15854887321',
    //     time: '2022-08-02 14:23:51',
    //     content: '<p> #thought </p><p><strong> #dddddd </strong> </p><ol><li> #11222 </li></ol>',
    //     tags: [ 'thought', 'dddddd', '11222' ],
    //     files: [
    //     'file/2022-08-02/143852/436fa6124c4733ca596fe24f0f982d56.jpeg',
    //     'file/2022-08-02/143852/a3ed9ecad84e175d45145df157cfb80d.jpeg',
    //     'file/2022-08-02/143852/a02496d1f71e4675cdb0281364a086ca.jpeg',
    //     'file/2022-08-02/143852/0bf26ffab6ae367ede209d8aaf388d66.jpeg',
    //     'file/2022-08-02/143852/1458f5c211bd784741609876d2b2d1bd.png'
    // ]
    const {dirname, content, tags, files} = memo
    let origin_content = content
    const only_tags = {}, tag_list = []
    for (const tag of tags) {
        if (tags.length === 0) {
            continue
        }
        if (only_tags.hasOwnProperty(tag)) {
            continue
        }
        const {tag_name, tag_value, single, group, children, tag_content} = tagTool.formatTagContent(tag)
        const regex = new RegExp('#' + tag_name.replace(/\\/g, '\\\\') + ' ', 'g')
        origin_content = origin_content.replace(regex, tag_content)
        only_tags[tag_name] = {tag_name, group, children, tag_content}
        if (tag_list.indexOf(tag_value) === -1) {
            tag_list.push(tag_value)
        }
    }
    const images = []
    for (const file of files) {
        const upload_res = await httpTool.upload(httpTool.host + 'api/user/upload', dirname + '/' + file, {hk: common.encodeDesktop(user_id), fromsource: 'import'})
        if (upload_res.code === 200) {
            images.push('<img src="' + upload_res.data.file + '"/>')
        }
    }
    if (images.length > 0) {
        origin_content += '<p>' + images.join('') + '</p>'
    }
    memo.content = origin_content
    memo.hash = noteTool.noteHash(content, 0, memo.time)
    memo.tag_list = tag_list
    return memo
}

exports.correctErrorWeight = async function () {
    const notes = await noteTool.allErrorNotes()
    if (!common.empty(notes) && notes.length > 0) {
        for (const item of notes) {
            const {id,weight,note,content} = item
            const note_content = common.strip(note)
            if (note_content !== content) {
                // let weight_value = weight
                // if (isNaN(parseFloat(weight)) || isNaN(parseInt(weight))) {
                //     weight_value = 1
                // }
                let weight_value = 1
                if (!isNaN(parseFloat(content)) || !isNaN(parseInt(content))) {
                    weight_value = parseInt(content)
                }
                await noteTool.inverseNoteWeightContent(id, weight_value, note_content)
            }
        }
    }
}