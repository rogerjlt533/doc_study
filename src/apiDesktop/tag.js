import request from '@/utils/request-desktop'
const actionTag = require('service/action/tag')

// 获取tag列表
export function getTagListApi(data){
    return request({
        url: 'actionTag.list',
        action: actionTag.list,
        data
    })
}

// 获取标签组
export function getGroupListApi(data){
    return request({
        url: 'actionTag.group',
        action: actionTag.group,
        data
    })
}

// 置顶标签
export function setTagTopApi(data){
    return request({
        url: 'actionTag.top',
        action: actionTag.top,
        data
    })
}

// 取消置顶标签
export function setTagNormalApi(data){
    return request({
        url: 'actionTag.normal',
        action: actionTag.normal,
        data
    })
}
