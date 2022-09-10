import request from '@/utils/request-desktop'
const actionSystem = require('service/action/system')

// 获取最新版本号
export function checkVersionApi(data){
    return request({
        url: 'actionSystem.version',
        action: actionSystem.version,
        data
    })
}
