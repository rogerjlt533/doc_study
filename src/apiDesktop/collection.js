import request from '@/utils/request-desktop'
const actionCollection = require('service/action/collection.js')

// 获取笔记本
export function getCollectionApi(data){
    return request({
        url: 'actionCollection.mine',
        action: actionCollection.mine,
        data
    })
}

// 新建笔记本
export function newCollectionApi(data){
    return request({
        url: 'actionCollection.new',
        action: actionCollection.new,
        data
    })
}

// 修改笔记本
export function editCollectionApi(data){
    return request({
        url: 'actionCollection.edit',
        action: actionCollection.edit,
        data
    })
}

// 删除笔记本
export function removeCollectionApi(data){
    return request({
        url: 'actionCollection.remove',
        action: actionCollection.remove,
        data
    })
}

// 直接删除collection笔记
export function clearCollectionNotesApi(data){
    return request({
        url: 'actionCollection.clearCollectionNotes',
        action: actionCollection.clearCollectionNotes,
        data
    })
}

// 迁移笔记本
export function moveCollectionNotesApi(data){
    return request({
        url: 'actionCollection.moveCollectionNotes',
        action: actionCollection.moveCollectionNotes,
        data
    })
}

// 笔记本排序
export function sortCollectionApi(data){
    return request({
        url: 'actionCollection.sort',
        action: actionCollection.sort,
        data
    })
}

