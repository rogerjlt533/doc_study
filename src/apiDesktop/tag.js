const actionTag = require('service/action/tag')

// 获取tag列表
async function getTagListApi(data){
    return await actionTag.list(...Object.values(data || {}))
}

// 获取标签组
async function getGroupListApi(data){
    return await actionTag.group(...Object.values(data || {}))
}

// 置顶标签
async function setTagTopApi(data){
    return await actionTag.top(...Object.values(data || {}))
}

// 取消置顶标签
async function setTagNormalApi(data){
    return await actionTag.normal(...Object.values(data || {}))
}

// 更新标签声母，填充空声母
async function fillTagInitialApi(data){
    return await actionTag.fillTagInitial(...Object.values(data || {}))
}

// 声母标签分组
async function getGroupInitialApi(data){
    return await actionTag.groupInitial(...Object.values(data || {}))
}

// 回收站声母标签分组
async function getGroupTrashInitialApi(data){
    return await actionTag.groupTrashInitial(...Object.values(data || {}))
}

export default {
    getTagListApi,
    getGroupListApi,
    setTagTopApi,
    setTagNormalApi,
    fillTagInitialApi,
    getGroupInitialApi,
    getGroupTrashInitialApi
}
