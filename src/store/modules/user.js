import { getToken, setToken, removeToken } from "@/utils/auth.js";
import { getUserInfoApi, getUserSettingApi,  setUserApi, getUserNoticeApi, getUserRightApi, getUserQuickApi } from "@/api/user"
import { getUserBaseApi } from '@/apiDesktop/user'
import { ElLoading } from "element-plus"


export default {
    namespaced: true,
    state: {
        isShowNotice: false,
        token: getToken() ? getToken() : "",
        userInfo: {},
        userSetting: {},
        userBase: {},
        noticeList: [],
        userRight: null,
        userQuickList: []
    },
    mutations: {
        RESET_TOKEN(state) {
            state.token = getToken();
        },
        SET_USER_INFO(state,data){
            state.userInfo = data;
        },
        SET_USER_SETTING(state, data){
            state.userSetting = data
        },
        SET_USER_BASE(state, data){
            state.userBase = data
        },
        SHOW_NOTICE(state, { data }){
            state.isShowNotice = data;
        },
        SET_NOTICE_LIST(state, data){
            state.noticeList = data;
        },
        SET_USER_RIGHT(state, data){
            state.userRight = data
        },
        SET_QUICK_LIST(state, data){
            state.userQuickList = data
        }
    },
    actions: {
        // 重置token
        resetToken({commit}){
            return new Promise((resolve, reject) => {
                removeToken()
                commit("RESET_TOKEN")
                resolve();
            })
        },
        // 获取用户信息
        getUserInfo({commit}, params){
            return new Promise((reslove, reject) => {
                getUserInfoApi().then((res) => {
                    if(res.code == 200){
                        commit("SET_USER_INFO", res.data)
                    }
                })
            })
        },
        // 获取用户权限
        getUserRight({commit}, params){
            return new Promise((reslove, reject) => {
                getUserRightApi().then((res) => {
                    if(res.code == 200){
                        commit("SET_USER_RIGHT", res.data)
                    }
                })
            })
        },
        // 获取用户设置
        getUserSetting({commit}, params){
            return new Promise((reslove, reject) => {
                getUserSettingApi().then((res) => {
                    if(res.code == 200){
                        commit("SET_USER_SETTING", res.data);
                        reslove(res.data)
                    }
                })
            })
        },
        // 获取用户基础信息设置
        async getUserBase({commit, rootState}){
            const user_id = rootState.user.userInfo.id
            const res = await getUserBaseApi({user_id})
            if(res.status_code === 200){
                commit("SET_USER_BASE", res.data)
            }
            // return new Promise((reslove, reject) => {
            //     getUserBaseApi().then((res) => {
            //         if(res.code == 200){
            //             commit("SET_USER_BASE", res.data)
            //         }
            //     })
            // })
        },
        // 设置用户信息
        setUser({commit}, params){
            return new Promise((reslove, reject) => {
                setUserApi(params).then((res) => {
                    if(res.code == 200){
                        // commit("SET_USER_BASE", res.data)
                    }
                })
            })
        },
        // 获取用户通知信息
        getUserNoticeList({commit}, params){
            return new Promise((reslove, reject) => {
                getUserNoticeApi(params).then((res) => {
                    if(res.code == 200){
                        commit("SET_NOTICE_LIST", res.data.message)
                    }
                })
            })
        },
        // 获取用户快捷用语
        getUserQuickList({commit}){
            return new Promise((reslove, reject) => {
                getUserQuickApi().then((res) => {
                    if(res.code == 200){
                        reslove(res)
                        commit("SET_QUICK_LIST", res.data)
                    }
                })
            })
        }
    }
}
