const actionCollection = require('service/action/collection.js')

// 获取笔记本
async function getCollectionApi(data){
    return await actionCollection.mine(...Object.values(data || {}))
}

// 新建笔记本
async function newCollectionApi(data){
    return await actionCollection.new(...Object.values(data || {}))
}

// 修改笔记本
async function editCollectionApi(data){
    return await actionCollection.edit(...Object.values(data || {}))
}

// 删除笔记本
async function removeCollectionApi(data){
    return await actionCollection.remove(...Object.values(data || {}))
}

// 直接删除collection笔记
async function clearCollectionNotesApi(data){
    return await actionCollection.clearCollectionNotes(...Object.values(data || {}))
}

// 迁移笔记本
async function moveCollectionNotesApi(data){
    return await actionCollection.moveCollectionNotes(...Object.values(data || {}))
}

// 笔记本排序
async function sortCollectionApi(data){
    return await actionCollection.sort(...Object.values(data || {}))
}

// 设置笔记本笔记最大上限
async function setMaxNumApi(data){
    return await actionCollection.setMaxNum(...Object.values(data || {}))
}

export default {
    getCollectionApi,
    newCollectionApi,
    editCollectionApi,
    removeCollectionApi,
    clearCollectionNotesApi,
    moveCollectionNotesApi,
    sortCollectionApi,
    setMaxNumApi
}


