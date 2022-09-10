import request from "../utils/request.js"

// 创建目标
export function addMissionApi(data){
    return request({
        url: "/api/collection/new",
        method: "put",
        data
    })
}

// 编辑目标
export function editMissionApi(data){
    return request({
        url: "/api/collection/edit",
        method: "post",
        data
    })
}

// 读取用户目标
export function getMissionApi(params){
    return request({
        url: "/api/collection/mine",
        method: "get",
        params
    })
}

// 编辑期望
export function editExceptionApi(data){
    return request({
        url: "/api/collection/exception/edit",
        method: "post",
        data
    })
}

// 移除期望
export function removeExceptionApi(data){
    return request({
        url: "/api/collection/exception/remove",
        method: "post",
        data
    })
}

// 删除collection
export function removeCollectionApi(data){
    return request({
        url: "/api/collection/remove",
        method: "post",
        data
    })
}

// 获取collection tag 图谱
export function getCollectionGraphApi(data){
    return request({
        url: "/api/collection/tag/graph",
        method: "post",
        data
    })
}

// collection sort
export function sortCollectionApi(data){
    return request({
        url: "/api/collection/sort",
        method: "post",
        data
    })
}

// add team collection
export function addTeamApi(data){
    return request({
        url: "/api/collection/invite",
        method: "post",
        data
    })
}

// shift out team collection
export function shiftOutApi(data){
    return request({
        url: "/api/collection/team/shiftout",
        method: "post",
        data
    })
}

// sign out team collection
export function signOutApi(data){
    return request({
        url: "/api/collection/team/quit",
        method: "post",
        data
    })
}


