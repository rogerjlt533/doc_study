import { ElLoading, ElMessageBox, ElMessage } from "element-plus"
import store from "@/store/index.js"
import { getToken, setToken, removeToken } from "./auth.js"
import { deepClone } from './tools'
import router from '../router/index'

let tipsContainer = null
const noVerifyCode = [200, 410]
const noVerifyUrl = ['actionUser.login', 'actionUser.wxQrLogin', 'actionUser.initUserInfo']

const request = async ({url, action, data}) => {
    return await action(...Object.values(data || {}))
}

export function goLogin (){
    router.push({
        name: "Login"
    })
}

export default request
