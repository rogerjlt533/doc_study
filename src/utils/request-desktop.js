import { ElLoading, ElMessageBox, ElMessage } from "element-plus"
import store from "@/store/index.js"
import { getToken, setToken, removeToken } from "./auth.js"
import { deepClone } from './tools'
import router from '../router/index'

let tipsContainer = null
const noVerifyCode = [200, 410]
const noVerifyUrl = ['actionUser.login', 'actionUser.wxQrLogin', 'actionUser.initUserInfo']

const request = async ({url, action, data}) => {
    console.log(`请求数据${url}`, data)
    if(data) {
        const hasToken = () => !getToken()
        if (hasToken() && !noVerifyUrl.includes(url)) {
            console.log(`登录失效`)
            handleLoginFaild()
            return false
        }
    }

    const res = await action(...Object.values(data))
    if(!res) return {
        status_code: '',
        data: {},
        message: '系统错误'
    }
    console.log(`返回结果${url}`, res);

    requestCallBack(res)

    return deepClone(res)
}

function requestCallBack(res){
    if(res.status_code === 500){
        handleLoginFaild()
    } else if(res.status_code === 401){
        ElMessageBox.confirm("PRO会员才有权限使用此功能哦~",{
            type: "warning",
            confirmButtonText: "立即开通",
            cancelButtonText: "就这样吧"
        }).then(() => {
            goLogin()
        }).catch((err)=>{})
    } else {
        // if( !noVertifyCode.includes(res.status_code) ){
        //     ElMessage({
        //         message: res.message || "系统繁忙",
        //         type: "error",
        //         duration: 5 * 1000
        //     })
        // }
    }
}

function handleLoginFaild(){
    if(tipsContainer) return false
    tipsContainer = ElMessage.warning("您的登录已经过期")
    removeToken()
    store.commit('CLEAR_VUEX')
    store.dispatch('user/resetToken').then(() => {
        goLogin()
    })
    setTimeout(() => {
        tipsContainer = null
    }, 5000)
}

export function goLogin (){
    router.push({
        name: "Login"
    })
}

export default request
