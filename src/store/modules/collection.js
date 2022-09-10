// import { getCollectionApi, newCollectionApi, editCollectionApi, removeCollectionApi, clearCollectionNotesApi, moveCollectionNotesApi, sortCollectionApi } from "@/apiDesktop/collection"
import request from "@/utils/mainRequest"

export default {
    namespaced: true,
    state: {
        projectListSelf: [],
        projectListTeam: []
    },
    mutations: {
        SET_PROJECT_LIST(state, data){
            state.projectListSelf = data.self_list.map(item => {
                item.ifEditTitle = false;
                return item;
            })
            state.projectListTeam = data.team_list.map(item => {
                item.ifEditTitle = false;
                return item;
            })
        },
        SET_COLLECTION_MAX_NUM(state, {collectionActive, val}){
            state.projectListSelf.forEach(item => {
                if(item.id === collectionActive){
                    item.max_num = val
                }
            })
        },
        SET_COLLECTION_STATUS(state, data){
            state.collectionStatus.max_num = data.max_num
        },
        handleAddCollection(state, data){
            data.id = data.collection_id;
            state.projectListSelf.push(data);
        },
        EDIT_PROJECT(state, data){
            const allList = [...state.projectListSelf, ...state.projectListTeam]

            allList.forEach((item) => {
                if(item.id === data.collection_id){
                    item.exception = data.exception
                    item.collection = data.collection
                    item.color = data.color
                }
            })
        },
        REMOVE_COLLECTION(state, data){
            let index = state.projectListSelf.findIndex(value => value.id === data)
            if(index > -1) state.projectListSelf.splice(index, 1)
        },
        SORT_COLLECTION(state, data){
            console.log('value', data.result)
            if(data.type === "self"){
                state.projectListSelf = data.result
            }
            if(data.type === "team"){
                state.projectListTeam = data.result
            }
        }
    },
    actions: {
        // 获取项目
        async getCollection({commit, rootState}, params){
            return new Promise((resolve, reject) => {
                request({
                    api: "getCollectionApi",
                    key: 'getCollectionApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        pages: 1,
                        size: 100
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("SET_PROJECT_LIST", res.data)
                        resolve()
                    }
                })
            })
        },

        // 添加项目
        addCollection({commit, rootState}, {collection, color }){
            return new Promise((resolve, reject) => {
                request({
                    api: "newCollectionApi",
                    key: 'newCollectionApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection,
                        color
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("handleAddCollection",res.data)
                    }
                    resolve(res)
                })
            })

        },

        // 修改项目
        editCollection({commit, rootState}, data){
            return new Promise((resolve, reject) => {
                request({
                    api: "editCollectionApi",
                    key: 'editCollectionApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection_id: data.collection_id,
                        collection: data.collection,
                        color: data.color
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("EDIT_PROJECT", res.data);
                    }
                    resolve(true)
                })
            })
        },

        // 删除collection
        removeCollection({commit, rootState}, params){
            return new Promise((resolve, reject) => {
                request({
                    api: "removeCollectionApi",
                    key: "removeCollectionApi",
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection_id: params.collection_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("REMOVE_COLLECTION", params.collection_id)
                    }
                    resolve(res)
                })
            })
        },
        // 清除collection中的笔记
        clearCollectionNotes({commit, rootState}, params){
            return new Promise((resolve, reject) => {
                request({
                    api: "clearCollectionNotesApi",
                    key: "clearCollectionNotesApi",
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection_id: params.collection_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("REMOVE_COLLECTION", params.collection_id)
                    }
                    resolve(res)
                })
            })
        },
        // 迁移collection中的笔记
        moveCollectionNotes({commit, rootState}, params){
            return new Promise((resolve, reject) => {
                request({
                    api: "moveCollectionNotesApi",
                    key: "moveCollectionNotesApi",
                    data: {
                        user_id: rootState.user.userInfo.id,
                        target_id,
                        source_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("REMOVE_COLLECTION", source_id)
                    }
                    resolve(res)
                })
            })
        },

        async sortCollection({commit, rootState}, {collection_ids}){
            request({
                api: 'sortCollectionApi',
                key: 'sortCollectionApi',
                data: {
                    user_id: rootState.user.userInfo.id,
                    collection_ids
                }
            })
        },
    }
}
