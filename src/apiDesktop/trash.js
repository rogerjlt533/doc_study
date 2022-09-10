import request from '@/utils/request-desktop'
const actionTrash = require('service/action/trash')

// 强制删除笔记
export function delTrashNoteApi(data){
    return request({
        url: 'actionTrash.del',
        action: actionTrash.del,
        data
    })
}

// 恢复笔记
export function restoreTrashNoteApi(data){
    return request({
        url: 'actionTrash.restore',
        action: actionTrash.restore,
        data
    })
}

// 清空废纸篓
export function clearTrashNoteApi(data){
    return request({
        url: 'actionTrash.clear',
        action: actionTrash.clear,
        data
    })
}
