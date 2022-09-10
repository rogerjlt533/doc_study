const actionNote = require('service/action/note')
const actionTool = require('service/tool/note')

// 新建笔记
async function newNoteApi(data){
    return await actionNote.new(...Object.values(data || {}))
}

// 获取笔记列表
async function getNotesApi(data){
    return await actionNote.mine(...Object.values(data || {}))
}

// 删除笔记
async function removeNoteApi(data){
    return await actionNote.remove(...Object.values(data || {}))
}

// 修改笔记
async function editNoteApi(data){
    return await actionNote.edit(...Object.values(data || {}))
}


// 笔记历史
async function getNotesHistoryApi(data){
    return await actionNote.history(...Object.values(data || {}))
}

// 回滚历史笔记
async function rollHistoryApi(data){
    return await actionNote.roll(...Object.values(data || {}))
}

// 合并笔记
async function compileNoteApi(data){
    return await actionNote.compile(...Object.values(data || {}))
}

// 引用笔记
async function quoteNoteApi(data){
    return await actionNote.quote(...Object.values(data || {}))
}

// 删除引用
async function removePostilApi(data){
    return await actionTool.removePostil(...Object.values(data || {}))
}

// 卡片笔记转写作笔记
async function convertToPageApi(data){
    return await actionNote.convertToPage(...Object.values(data || {}))
}

// 获取远程笔记的id
async function getRemoteIdApi(data){
    return await actionNote.getRemoteId(...Object.values(data || {}))
}

// 更换笔记本
async function changeCollectionApi(data){
    return await actionNote.changeCollection(...Object.values(data || {}))
}


export default {
    newNoteApi,
    getNotesApi,
    removeNoteApi,
    editNoteApi,
    getNotesHistoryApi,
    rollHistoryApi,
    compileNoteApi,
    quoteNoteApi,
    removePostilApi,
    convertToPageApi,
    getRemoteIdApi,
    changeCollectionApi
}

