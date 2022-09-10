import request from "../utils/request.js"

// 注册
export function registerApi(data){
    return request({
        url: "/api/user/register",
        method: "put",
        data
    })
}

// 登录
export function loginApi(data){
    return request({
        url: "/api/user/signin",
        method: "post",
        data
    })
}

// 注册获取手机验证码
export function registerSmsApi(data){
    return request({
        url: "/api/user/register/sms",
        method: "post",
        data
    })
}

// 设置昵称
export function setNameApi(data){
    return request({
        url: "/api/user/set/name",
        method: "post",
        data
    })
}

// 设值头像
export function setAvatarApi(data){
    return request({
        url: "/api/user/avatar",
        method: "post",
        data
    })
}

// 设置个性域名
export function domainApi(data){
    return request({
        url: "/api/user/domain",
        method: "post",
        data
    })
}

// 设置头像
export function avatarApi(data){
    return request({
        url: "/api/user/avatar",
        method: "post",
        data
    })
}

// 获取用户信息
export function getUserInfoApi(params){
    return request({
        url: "/api/user/info",
        method: "get",
        params
    })
}

// 读取用户设置
export function getUserSettingApi(params){
    return request({
        url: "/api/user/setting",
        method: "get",
        params
    })
}

// 读取用户权限
export function getUserRightApi(params){
    return request({
        url: "/api/user/right",
        method: "get",
        params
    })
}

// 获取邮箱验证码
export function verifyEmailApi(data){
    return request({
        url: "/api/user/bind/email",
        method: "post",
        data
    })
}

// 获取手机验证码
export function verifyMobileApi(data){
    return request({
        url: "/api/user/bind/mobile",
        method: "post",
        data
    })
}
// 保存手机号码
export function checkMobileApi(data){
    return request({
        url: "/api/user/check/mobile",
        method: "post",
        data
    })
}

// 用户默认存放笔记
export function setGoalApi(data){
    return request({
        url: "/api/user/set/goal",
        method: "post",
        data
    })
}

// 获取用户基本信息()
export function getUserBaseApi(params){
    return request({
        url: "/api/user/base",
        method: "get",
        params
    })
}

// 绑定微信
export function bindWechatApi(params){
    return request({
        url: "/api/user/bing_qr",
        method: "get",
        params
    })
}

// 重置密码获取二维码
export function resetPasswordApi(params){
    return request({
        url: "/api/user/reset_qr",
        method: "get",
        params
    })
}

// 获取用户信息通知
export function getUserNoticeApi(params){
    return request({
        url: "/api/user/message",
        method: "get",
        params
    })
}
// 已读用户信息通知
export function haveReadApi(data){
    return request({
        url: "/api/user/message/read",
        method: "post",
        data
    })
}
// 全部已读
export function haveReadAllApi(data){
    return request({
        url: "/api/user/message/read/all",
        method: "post",
        data
    })
}

// 用户通知信息设置
export function setUserApi(data){
    return request({
        url: "/api/user/set/item",
        method: "post",
        data
    })
}

// 获取购买的二维码
export function getPayApi(data){
    return request({
        url: "/api/order/native",
        method: "post",
        data
    })
}

// 读取用户日历打卡活动
export function getCalendarApi(data){
    return request({
        url: "/api/marketing/calendar",
        method: "post",
        data
    })
}

// 领奖池
export function getGiftsApi(params){
    return request({
        url: "/api/marketing/gifts",
        method: "get",
        params
    })
}

// 领奖
export function marketingDrawApi(params){
    return request({
        url: "/api/marketing/draw",
        method: "get",
        params
    })
}

// 校验支付是否成功
export function verifyPayApi(data){
    return request({
        url: "/api/order/verify/pay",
        method: "post",
        data
    })
}

// 兑换码兑换
export function redemptionCodeApi(data){
    return request({
        url: "/api/order/pro_code",
        method: "post",
        data
    })
}

// 获取用户是否绑定了微信
export  function verifyBindWXApi(params){
    return request({
        url: "/api/user/wx/is_bind",
        method: "get",
        params
    })
}

// 获取用户快捷用户
export function getUserQuickApi(params){
    return request({
        url: "/api/user/quick",
        method: "get",
        params
    })
}

// 设置用户快捷用语
export function setUserQuickApi(data){
    return request({
        url: "/api/user/quick/set",
        method: "post",
        data
    })
}

// 删除用户快捷用语
export function deteleUserQuickApi(params){
    return request({
        url: "/api/user/quick/del",
        method: "get",
        params
    })
}

// 更新快捷用语
export function updateUserQuickApi(data){
    return request({
        url: "/api/user/quick/update",
        method: "post",
        data
    })
}

// 同步到notion
export function notionSyncApi(data){
    return request({
        url: "/api/open/notion/auth",
        method: "post",
        data
    })
}

// 获取notion databases 
export function getNotionDatabasesApi(params){
    return request({
        url: "/api/open/notion/databases",
        method: "get",
        params
    })
}

// notion database 创建关系
export function bindNotionDatabaseApi(data){
    return request({
        url: "/api/open/notion/bind",
        method: "post",
        data
    })
}

// notion database 绑定状态
export function bindStatusApi(params){
    return request({
        url: '/api/open/notion/is_bind',
        method: "get",
        params
    })
}

// notion database 发起同步
export function syncNotionDatabaseApi(data){
    return request({
        url: "/api/open/notion/sync",
        method: "post",
        data
    })
}

// notion database 发起同步
export function relationNotionDatabaseApi(params){
    return request({
        url: "/api/open/notion/relation",
        method: "get",
        params
    })
}

// 导出笔记为markdown
export function exportNoteToMarkdownApi(params){
    return request({
        url: "/api/collection/export/markdown",
        method: "get",
        params
    })
}

// 获取用户api地址
export function getUserApiApi(params){
    return request({
        url: "/api/user/api_addr",
        method: "get",
        params
    })
}

// 手机验证码登录--获取手机验证码
export function getSmsApi(data){
    return request({
        url: "/api/user/login/sms/get",
        method: "post",
        data
    })
}

// 手机验证码登录
export function verifySmsApi(data){
    return request({
        url: "/api/user/login/sms/verify",
        method: "post",
        data
    })
}

// 微信登录 -- 获取微信登录二维码
export function getWxQrApi(params){
    return request({
        url: "/api/user/login/wx/qr",
        method: "get",
        params
    })
}

// 微信登录轮询逻辑
export function rotateWxApi(params){
    return request({
        url: "/api/user/login/wx/rotate",
        method: "get",
        params
    })
}

// 微信扫码注册
export function registerWxApi(params){
    return request({
        url: "/api/wx/register",
        method: "get",
        params
    })
}

// 微信扫码注册--轮询验证
export function verifyRegisterWxApi(data){
    return request({
        url: "/api/wx/register/verify",
        method: "post",
        data
    })
}

// 用户意见反馈
export function userFeedbackApi(data){
    return request({
        url: "/api/user/feedback",
        method: "post",
        data
    })
}








