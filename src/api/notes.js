import request from "../utils/request.js"

// 新建笔记
export function newNoteApi(data){
    return request({
        url: "/api/note/new",
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        data
    })
}
// 获取所有我的笔记
export function getNotesApi(params){
    return request({
        url: "/api/note/mine",
        method: "get",
        params
    })
}
// 删除笔记
export function removeNoteApi(data){
    console.log(data);
    return request({
        url: "/api/note/remove",
        method: "post",
        data
    })
}

// 编辑笔记
export function editNoteApi(data){
    return request({
        url: "/api/note/edit",
        method: "post",
        data
    })
}

// 分享笔记
export function shareNoteApi(data){
    return request({
        url: "/api/note/share",
        method: "post",
        data
    })
}

// 读取标签组
export function getTagsGroupApi(params){
    return request({
        url: "/api/tag/group/list",
        method: "get",
        params
    })
}

// 读取用户所有的标签
export function getTagsApi(params){
    return request({
        url: "/api/tag/mine",
        method: "get",
        params
    })
}

// 删除标签
export function removeTagsApi(data){
    return request({
        url: "/api/tag/remove",
        method: "post",
        data
    })
}

// 编辑标签
export function editTagsApi(data){
    return request({
        url: "/api/tag/edit",
        method: "post",
        data
    })
}

// 置顶标签
export function topTagsApi(data){
    return request({
        url: "/api/tag/top",
        method: "post",
        data
    })
}

// 取消置顶标签
export function normalTagsApi(data){
    return request({
        url: "/api/tag/normal",
        method: "post",
        data
    })
}

// 图片上传接口
export function uploadImage(data){
    return request({
        url: "/api/user/upload",
        methods: "post",
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data
    })
}

// 从回收站删除笔记
export function deleteNoteApi(data){
    return request({
        url: "/api/trash/del",
        method: "post",
        data
    })
}

// 从回收站恢复笔记
export function restoreNoteApi(data){
    return request({
        url: "/api/trash/restore",
        method: "post",
        data
    })
}

// 笔记转语音
export function mp3NoteApi(params){
    return request({
        url: "/api/note/mp3",
        method: "get",
        params
    })
}

// 读取笔记历史
export function getNotesHistoryApi(params){
    return request({
        url: "/api/note/history",
        method: "get",
        params
    })
}

// 恢复笔记历史
export function recoveryNotesHistoryApi(data){
    return request({
        url: "/api/note/roll",
        method: "post",
        data
    })
}

// 图片转文字
export function imageToWordApi(data){
    return request({
        url: "/api/tools/image/words",
        method: "post",
        data
    })
}

// 单笔记页面
export function noteInfoApi(params){
    return request({
        url: "/api/note/info",
        method: "get",
        params
    })
}

// 清倒废纸篓
export function clearTrashApi(data){
    return request({
        url: "/api/trash/clear",
        method: "post",
        data
    })
}

// 笔记拖拽合并
export function compileNoteApi(data){
    return request({
        url: "/api/note/compile",
        method: "post",
        data
    })
}

// 笔记拖拽引用
export function quoteNoteApi(data){
    return request({
        url: "/api/note/quote",
        method: "post",
        data
    })
}





