import request from '@/utils/request-desktop'
const actionNote = require('service/action/note')
const actionTool = require('service/tool/note')

// 新建笔记
export function newNoteApi(data){
    return request({
        url: 'actionNote.new',
        action: actionNote.new,
        data
    })
}

// 获取笔记列表
export function getNotesApi(data){
    return request({
        url: 'actionNote.mine',
        action: actionNote.mine,
        data
    })
}

// 删除笔记
export function removeNoteApi(data){
    return request({
        url: 'actionNote.remove',
        action: actionNote.remove,
        data
    })
}

// 修改笔记
export function editNoteApi(data){
    return request({
        url: 'actionNote.edit',
        action: actionNote.edit,
        data
    })
}


// 笔记历史
export function getNotesHistoryApi(data){
    return request({
        url: 'actionNote.history',
        action: actionNote.history,
        data
    })
}

// 回滚历史笔记
export function rollHistoryApi(data){
    return request({
        url: 'actionNote.roll',
        action: actionNote.roll,
        data
    })
}

// 合并笔记
export function compileNoteApi(data){
    return request({
        url: 'actionNote.compile',
        action: actionNote.compile,
        data
    })
}

// 引用笔记
export function quoteNoteApi(data){
    return request({
        url: 'actionNote.quote',
        action: actionNote.quote,
        data
    })
}

// 删除引用
export function removePostilApi(data){
    return request({
        url: 'actionTool.removePostil',
        action: actionTool.removePostil,
        data
    })
}




