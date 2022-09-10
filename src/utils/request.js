import axios from "axios"
import { ElLoading, ElMessageBox, ElMessage } from "element-plus"
import { getToken, setToken, removeToken } from "./auth.js"
import store from "@/store/index.js"
import router from '../router/index'
import qs from "qs"
import {h} from "vue"
import openUrlByBrowser from "@/assets/js/openUrlByBrowser"
import {isEast8th} from "@/utils/tools"

let loadingInstance;
let msgBox;
const service = axios.create({
    baseURL: process.env.VUE_APP_URL,
    timeout: 15000,
    headers: {
        // "Content-Type": "application/x-www-form-urlencoded"
    }
})

service.interceptors.request.use( config => {
    if(loadingInstance){
        // loadingInstance.close();
    }
    if(getToken("token")){
        config.headers["hk"] = getToken("token")
    }
    if(config.method === "post"){
        config.data = qs.stringify(config.data)
    }

    return config;
},error => {
    return Promise.reject(error)
})

const vertifyRouter = ['/api/order/verify/pay', '/api/user/login/wx/rotate', '/api/wx/register/verify']
const noVertifyCode = [200, 410]

service.interceptors.response.use( response => {
    const res = response.data;
    let status = response.status;
    // 先判断登录接口,如果res返回错误则说明账户密码错误
    if(response.config.url.slice(response.config.baseURL.length) === "/api/user/signin"){
        if(!res){
            ElMessage({
                message: "账号或者密码错误",
                type: "error",
                duration: 5 * 1000
            })
        }
    }
    if(status === 200){
        if(res.code === 500){
            if(msgBox) return false
            msgBox =  ElMessageBox.confirm("您的登录已经过期, 请重新登录",{
                type: "warning",
                confirmButtonText: "去登录",
                showCancelButton: false
            }).then(() => {
                store.commit('CLEAR_VUEX')
                store.dispatch('user/resetToken').then(() => {
                    router.push({
                        name: "Login"
                    })
                });
            }).catch((err)=>{})
        } else if(res.code === 401){
            if(msgBox) return false
            msgBox = ElMessageBox.confirm("PRO会员才有权限使用此功能哦~",{
                type: "warning",
                confirmButtonText: "立即开通",
                cancelButtonText: "就这样吧"
            }).then(() => {
                if(isEast8th()){
                    openUrlByBrowser('https://www.fang-cun.net/user')
                }else{
                    openUrlByBrowser('https://fangcun.in/user')
                }
            }).catch((err)=>{})
        } else if(res.code === 4001) {
            ElMessageBox({
                type: 'alert',
                title: "提示",
                message: h('div', undefined, [
                    h('p', {
                        class: 'text-center'
                    }, '请先授权你的语雀同步凭证'),
                    h('p', {
                        class: 'pt10 text-center link-style',
                        onClick: () => {
                            openUrlByBrowser('https://help.fang-cun.net/help/yuque.html')
                        }
                    }, '使用帮助')
                ]),
                dangerouslyUseHTMLString: true,
                showCancelButton: false,
                confirmButtonText: '我已了解，去授权 >'
            }).then(() => {
                if(isEast8th()){
                    openUrlByBrowser('https://www.fang-cun.net/user')
                }else{
                    openUrlByBrowser('https://fangcun.in/user')
                }
            }).catch((err) => {})
        } else {
            if( !noVertifyCode.includes(res.code) && !vertifyRouter.includes(response.config.url)){
                ElMessage({
                    message: res.message || "系统繁忙",
                    type: "error",
                    duration: 2 * 1000
                })
            }
        }
        setTimeout(() => {
            msgBox = null
        }, 5000)
        return res
    }

}, error => {
    console.log(error);
    // loadingInstance.close();
    ElMessage({
        message: error.msg || "系统繁忙",
        type: "error",
        duration: 5 * 1000
    })

    return Promise.reject(error)
})

export default service;
