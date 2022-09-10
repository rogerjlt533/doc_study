const actionUser = require('service/action/user')

// 用户登录
async function loginApi(data){
    return await actionUser.login(...Object.values(data || {}))
}

// 获取用户基础信息
async function getUserBaseApi(data){
    return await actionUser.base(...Object.values(data || {}))
}

// 初始化用户基础信息
async function initUserInfoApi(data){
    return await actionUser.initUserInfo(...Object.values(data || {}))
}

// 微信登录
async function wxQrLoginApi(data){
    return await actionUser.wxQrLogin(...Object.values(data || {}))
}

export default {
    loginApi,
    getUserBaseApi,
    initUserInfoApi,
    wxQrLoginApi
}
