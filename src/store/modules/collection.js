import { getCollectionApi, newCollectionApi, editCollectionApi, removeCollectionApi, clearCollectionNotesApi, moveCollectionNotesApi, sortCollectionApi } from "@/apiDesktop/collection"

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
        ADD_COLLECTION(state, data){
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
            const res = await getCollectionApi({
                user_id: rootState.user.userInfo.id,
                pages: 1,
                size: 100
            })
            if(res.status_code === 200){
                commit("SET_PROJECT_LIST", res.data)
            }
        },

        // 添加项目
        async addCollection({commit, rootState}, {collection, color }){
            let res = await newCollectionApi({
                user_id: rootState.user.userInfo.id,
                collection,
                color
            })
            if(res.status_code === 200){
                commit("ADD_COLLECTION",res.data);
            }
            return res
        },

        // 修改项目
        async editCollection({commit, rootState}, data){
            const res = await editCollectionApi({
                user_id: rootState.user.userInfo.id,
                collection_id: data.collection_id,
                collection: data.collection,
                color: data.color
            })
            if(res.status_code === 200){
                commit("EDIT_PROJECT", res.data);
                return true
            }
        },

        // 删除collection
        async removeCollection({commit, rootState}, params){
            const res = await removeCollectionApi({
                user_id: rootState.user.userInfo.id,
                collection_id: params.collection_id
            })
            if(res.status_code === 200){
                commit("REMOVE_COLLECTION", params.collection_id)
            }
            return res
        },
        // 清除collection中的笔记
        async clearCollectionNotes({commit, rootState}, params){
            const res = await clearCollectionNotesApi({
                user_id: rootState.user.userInfo.id,
                collection_id: params.collection_id
            })
            if(res.status_code === 200){
                commit("REMOVE_COLLECTION", params.collection_id)
            }
            return res
        },
        // 迁移collection中的笔记
        async moveCollectionNotes({commit, rootState}, params){
            const { target_id, source_id } = params
            const res = await moveCollectionNotesApi({
                user_id: rootState.user.userInfo.id,
                target_id,
                source_id
            })
            if(res.status_code === 200){
                commit("REMOVE_COLLECTION", source_id)
            }
            return res
        },

        async sortCollection({commit, rootState}, {collection_ids}){
            const res = await sortCollectionApi({
                user_id: rootState.user.userInfo.id,
                collection_ids
            })
        },
    }
}
