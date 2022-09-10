import { removeHtmlTag, deepClone, debounceFun } from '@/utils/tools'
import { handleContentHtml } from '@/utils/processHtml'
import { handleRestructureConfig } from '@/utils/restructureConfig'
import { ElMessageBox, ElNotification } from "element-plus"
import bus from '@/utils/bus';
import request from '@/utils/mainRequest'
import {ipcRenderer} from "electron";

const tagService = require('service/service/tag')
const imgReg = /<img.*?(?:>|\/>)/gi
const srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i

export default {
    namespaced: true,
    state: {
        cachedNote: "",
        notesListHeight: "calc(100vh - 208px)",
        catalogState: {
            showSelfCollection: true,
            showTeamCollection: false,
            showTags: false
        },
        catalogActiveState: {
            noteTypeActive: 1,
            collectionActive: '',
            tagActive: '',
            tagGroupActive: '',
            trashActive: false,
            collectionTitle: '',
            tagTitle: '',
            tagGroupTitle: '',
            short_note_count: 0,
            long_note_count: 0,
            start_time: "",
            end_time: ""
        },
        notes: {
            tag_id: '',
            group_id: '',
            collection_id: '',
            trash: '',
            note_type: 1,
            orderby_create: 1,
            orderby_weight: 0,
            sort: "desc",
            start_time: "",
            end_time: ""
        },
        writeNoteState: {
            active: '',
            note: '',
            collection_id: ''
        },
        showWriteMenu: false,
        editNoteCount: 0,
        editNotes: {},
        noteslist: [],
        notesCount: 0,
        writeNotesList: [],
        tagsGroupList: [],
        tagsAllList: [],
        tagsTopList: [],
        tagsList: [],
        tagInitialList: {
            pt: [],
            fz: []
        },
        isFinish: true,
        searchHistoryList: []
    },
    mutations: {
        /**
         * 修改list的高度,使list的高度始终在页面范围之内
         * 条件:
         * 1.编辑器中内容更新时
         * 2.记录笔记时
         * 3.引用笔记时
         * 4.展开收起引用模块时
         * 5.页面初始化时
         */
        SET_NOTES_LIST_HEIGHT(state, data){
            state.notesListHeight = `calc(100vh - ${data + 110}px)`
        },
        // 设置目录的展开收起状态
        CHANGE_CATALOG_STATE(state, { showSelfCollection, showTeamCollection, showTags }){
            state.catalogState.showSelfCollection =
                showSelfCollection === undefined ? state.catalogState.showSelfCollection : showSelfCollection
            state.catalogState.showTeamCollection =
                showSelfCollection === undefined ? state.catalogState.showTeamCollection : showTeamCollection
            state.catalogState.showTags =
                showTags === undefined ? state.catalogState.showTags : showTags
        },
        // 设置笔记本、标签、分组标签、废纸篓的选中状态
        CHANGE_CATALOG_ACTIVE_STATE(state, { noteTypeActive, collectionActive, tagActive, tagGroupActive, trashActive, collectionTitle, tagTitle, tagGroupTitle, short_note_count, long_note_count, start_time, end_time }){
            state.catalogActiveState.noteTypeActive =
                noteTypeActive === undefined ? state.catalogActiveState.noteTypeActive : noteTypeActive
            state.catalogActiveState.collectionActive =
                collectionActive === undefined ? state.catalogActiveState.collectionActive : collectionActive
            state.catalogActiveState.tagActive =
                tagActive === undefined ? state.catalogActiveState.tagActive : tagActive
            state.catalogActiveState.tagGroupActive =
                tagGroupActive === undefined ? state.catalogActiveState.tagGroupActive : tagGroupActive
            state.catalogActiveState.trashActive =
                trashActive === undefined ? state.catalogActiveState.trashActive : trashActive
            state.catalogActiveState.collectionTitle =
                collectionTitle === undefined ? state.catalogActiveState.collectionTitle : collectionTitle
            state.catalogActiveState.tagTitle =
                tagTitle === undefined ? state.catalogActiveState.tagTitle : tagTitle
            state.catalogActiveState.tagGroupTitle =
                tagGroupTitle === undefined ? state.catalogActiveState.tagGroupTitle : tagGroupTitle
            state.catalogActiveState.short_note_count =
                short_note_count === undefined ? state.catalogActiveState.short_note_count : short_note_count
            state.catalogActiveState.long_note_count =
                long_note_count === undefined ? state.catalogActiveState.long_note_count : long_note_count
            state.catalogActiveState.start_time =
                start_time === undefined ? state.catalogActiveState.start_time : start_time
            state.catalogActiveState.end_time =
                end_time === undefined ? state.catalogActiveState.end_time : end_time
        },
        // 设置笔记本筛选条件的参数
        CHANGE_FILTER_NOTE_PARAMS(state, { trash, collection_id, tag_id, group_id, note_type, orderby_create, orderby_weight, sort, start_time, end_time }){
            state.notes.trash = trash === undefined ? state.notes.trash : trash
            state.notes.collection_id = collection_id === undefined ? state.notes.collection_id : collection_id
            state.notes.tag_id = tag_id === undefined ? state.notes.tag_id : tag_id
            state.notes.group_id = group_id === undefined ? state.notes.group_id : group_id
            state.notes.note_type = note_type === undefined ? state.notes.note_type : note_type
            state.notes.orderby_create = orderby_create === undefined ? state.notes.orderby_create : orderby_create
            state.notes.orderby_weight = orderby_weight === undefined ? state.notes.orderby_weight : orderby_weight
            state.notes.sort = sort === undefined ? state.notes.sort : sort
            state.notes.start_time = start_time === undefined ? state.notes.start_time : start_time
            state.notes.end_time = end_time === undefined ? state.notes.end_time : end_time
        },
        // 设置写作笔记的状态
        SET_WRITE_NOTE_STATE(state, { active }){
            state.writeNoteState.active = active
        },
        SET_WRITE_MENU_SHOW(state, data){
            state.showWriteMenu = data
        },
        // collection切换顺序时，修改选中collection的index
        SORT_CHANGE_COLLECTION_ACTIVE(state, { collectionActive }){
            state.catalogActiveState.collectionActive = collectionActive
        },
        // 笔记筛选长短笔记
        FILTER_NOTES_TYPE(state, { type = !state.notes.note_type }){
            state.notes.note_type = type;
        },
        RESET_NOTES_LIST(state){
            state.noteslist = []
        },
        SET_NOTES_LIST(state, { list, count }){
            state.noteslist = state.noteslist.concat(list)
            state.notesCount = count
        },
        SET_WRITE_NOTES_LIST(state, {list}){
            state.writeNotesList = list
        },
        ADD_NOTE(state, {note_type, data}) {
            if (state.notes.trash) return
            if (note_type === 1) {
                data = handleNoteImg(data)
                state.notes.sort === "desc" ? state.noteslist.unshift(data) : state.noteslist.push(data)
                state.catalogActiveState.short_note_count++
                return
            }
            if (note_type === 2) {
                data.desc = removeHtmlTag(data.note)
                state.catalogActiveState.long_note_count++
                state.notes.sort === "desc" ? state.writeNotesList.unshift(data) : state.writeNotesList.push(data)
            }
        },
        REMOVE_NOTE(state, {index, note_type}){
            console.log("！23123123", index, note_type)
            if(note_type === 1){
                state.noteslist.splice(index, 1)
                state.catalogActiveState.short_note_count --
                return
            }
            if(note_type === 2){
                state.writeNotesList.splice(index, 1);
                state.catalogActiveState.long_note_count --
            }
        },
        SET_EDIT_NOTE_OBJ(state, {note_id, props, html, json}){
            state.editNotes[note_id] = {
                props, html, json
            }
        },
        REMOVE_EDIT_NOTE_OBJ(state, {note_id}){
            if (note_id && state.editNotes[note_id]) {
                delete state.editNotes[note_id]
            }
        },
        CLEAR_EDITE_NOTE_OBJ(state){
            state.editNotes = {}
        },
        SET_EDIT_NOTE_COUNT(state, data){
            // 1 为 +   0 为 —
            if(data === undefined) {
                state.editNoteCount = 0
                return
            }
            if(data === 1){
                state.editNoteCount ++
            }else{
                state.editNoteCount --
            }
        },
        EDIT_NOTE(state, {data, index, noteType = 1}){
            if(noteType === 2){
                data.desc = removeHtmlTag(data.note)
                Object.keys(state.writeNotesList[index]).forEach((key) => {
                    state.writeNotesList[index][key] = data[key]
                })
            }else{
                data = handleNoteImg(data)
                Object.keys(state.noteslist[index]).forEach((key) => {
                    state.noteslist[index][key] = data[key]
                })

                console.log('state.noteslist[index]', state.noteslist[index])
            }
        },
        SET_NOTESlIST_IF_DOWN(state, data){
            state.isFinish = data;
        },
        RECOVERY_NOTE(state, data){
            data = handleNoteImg(data)
            let index = state.noteslist.findIndex(item => item.id === data.id)
            state.noteslist[index] = data
        },

        // 标签相关
        SET_TAGS_GROUP(state, data) {
            state.tagsGroupList = data.map((item) => {
                item.isShow = false
                return item
            })
        },
        SET_TAGS_LIST(state, data) {
            state.tagsTopList = data.filter(item => {
                if(item.is_top === 1){
                    item.showOptions = false;
                }
                return item.is_top === 1
            });
            state.tagsList = data.filter(item => {
                if(item.is_top === 0){
                    item.showOptions = false;
                }
                return item.is_top === 0
            });
        },
        SET_TAGS_ALL_LIST(state, data){
            state.tagsAllList = data;
        },
        ADD_NEW_TAGS(state, data){
            // 去除已存在的
            state.tagsList.forEach( (item) => {
                data.forEach( (tag,tagi) => {
                    if( (item.id == tag.id) && (item.tag == tag.tag) ){
                        data.splice(tagi, 1)
                    }
                })
            })
            // 合并没有的
            state.tagsList = state.tagsList.concat(data);
        },
        SET_TOP_TAGS(state, data){
            state.tagsList.forEach((item,index) => {
                if(item.id == data){
                    state.tagsList.splice(index, 1);
                    state.tagsTopList.push(item)
                }
            })
        },
        REMOVE_TOP_TAGS(state, data){
            state.tagsTopList.forEach((item,index) => {
                if(item.id === data){
                    state.tagsTopList.splice(index, 1);
                    state.tagsList.push(item)
                }
            })
        },
        SET_TAG_INITIAL_LIST(state, data){
            state.tagInitialList.pt = []
            state.tagInitialList.fz = []
            data.forEach( tag => {
                if(tag.is_default){
                    state.tagInitialList.pt.push(tag)
                } else {
                    state.tagInitialList.fz.push(tag)
                }
            })
        },
        // 新增历史搜索项
        ADD_SEARCH_HISTORY_LIST(state, data){
            if(!data) return
            const hasItem = state.searchHistoryList.find(item => item.value === data)
            if(hasItem) return
            const obj = {
                value: data
            }
            state.searchHistoryList.unshift(obj)
            if(state.searchHistoryList.length > 9){
                state.searchHistoryList.splice(state.searchHistoryList.length - 1, 1)
            }
        },
        // 删除历史搜索项
        REMOVE_SEARCH_HISTORY_LIST(state, data){
            const index = state.searchHistoryList.findIndex(item => item.value === data)
            state.searchHistoryList.splice(index, 1)
        },

        // 历史笔记恢复
        RECOVERY_HISTORY(state, data){
            let index = state.noteslist.findIndex(item => item.id === data.id);
            state.noteslist[index].note = data.note;
        },
        // 缓存当前笔记
        CACHED_NOTE(state, data){
            state.cachedNote = data
        },
        // 清楚缓存的笔记
        CLEAR_CACHED_NOTE(state, data){
            setTimeout(() => {
                state.cachedNote = ""
            }, 1500)
        }
    },
    actions: {
        // 获取短笔记列表
        getShortNotesList({state, commit, rootState}, data){
            const size = 30
            let params = {
                tag_id: state.notes.tag_id,
                group_id: state.notes.group_id,
                keyword: data.keyword,
                collection_id: state.notes.collection_id,
                today: undefined,
                orderby_create: state.notes.orderby_create,
                orderby_weight: state.notes.orderby_weight,
                sort: state.notes.sort,
                start_time: state.notes.start_time,
                end_time: state.notes.end_time,
                note_type: 1
            }
            const noteParams = {
                user_id: rootState.user.userInfo.id,
                params,
                trash: state.notes.trash,
                page: data.page || 1,
                size
            }
            return new Promise((resolve, reject) => {
                noteParams.params = deepClone(params)
                request({
                    api: 'getNotesApi',
                    key: 'getNotesApi',
                    data: noteParams
                }, (res) => {
                    if(res.status_code === 200){
                        let list = res.data.note || []
                        let count = res.data.count

                        list = list.map(note => handleNoteImg(note))

                        // 判断是否列表结束
                        // let pageSize = data.page === 1 ? 20 : size
                        commit("SET_NOTESlIST_IF_DOWN", !(list.length < size))
                        if(data.page === 1) commit("RESET_NOTES_LIST")
                        commit("SET_NOTES_LIST", {
                            list,
                            count
                        })
                        commit('CHANGE_CATALOG_ACTIVE_STATE', {
                            short_note_count: res.data.count || 0
                        })

                        resolve(res)
                    }
                })


            })

        },
        // 获取长笔记
        getWriteNotesList({state, commit, rootState}, data){
            const size = 100
            let params = {
                tag_id: state.notes.tag_id,
                group_id: state.notes.group_id,
                keyword: data.keyword,
                collection_id: state.notes.collection_id,
                today: undefined,
                orderby_create: 0,
                sort: "desc",
                start_time: '',
                end_time: '',
                note_type: 2
            }
            const noteParams = {
                user_id: rootState.user.userInfo.id,
                params: null,
                trash: state.notes.trash,
                page: data.page || 1,
                size: size
            }

            return new Promise((resolve, reject) => {
                noteParams.params = deepClone(params)
                request({
                    api: 'getNotesApi',
                    key: 'getNotesApi2',
                    data: noteParams
                }, (res) => {
                    if(res.status_code === 200){
                        let list = res.data.note || []
                        let count = res.data.count

                        // 处理长笔记
                        if(list.length){
                            list.forEach(item => {
                                if(item.note_type === 2) item.desc = removeHtmlTag(item.note)
                            })
                        }
                        commit("SET_WRITE_NOTES_LIST", {
                            list,
                            count
                        })
                        commit('CHANGE_CATALOG_ACTIVE_STATE', {
                            long_note_count: res.data.count || 0
                        })

                        resolve(res)
                    }
                })
            })
        },

        // 添加笔记
        addNotes({state, commit, dispatch, rootState}, { json, html, annotation_id, note_type, isFast }){
            debounceFun(handleRestructureConfig, 500) // 检测本地config.json文件格式
            if(!state.notes.collection_id){
                ElMessageBox.confirm('保存失败，因为您还没有指定记录的笔记本~~', {
                    type: 'error',
                    cancelButtonText: '知道了',
                    confirmButtonText: '马上新建'
                }).then(() => {
                    bus.emit('handleAddCollection')
                })
                return false
            }
            const default_collection = rootState.user.userBase.default_collection
            const { tag_list, contentHtml } = handleContentHtml(html)
            const user_id = rootState.user.userInfo.id
            const collection_id = isFast ? default_collection : state.notes.collection_id
            const noteType = note_type || 1
            const source = "desktop"
            const content = contentHtml
            const url = ''
            const postil_list = [ annotation_id ]
            const { list } = tagService.tagTool.json2Tree(json)
            const struct_list = tagService.tagTool.filterTreeKey(list)
            let params = {user_id, collection_id, noteType, source, content, url, postil_list, tag_list, struct_list}

            return new Promise((resolve) => {
                request({
                    api: 'newNoteApi',
                    key: 'newNoteApi',
                    data: params
                }, (res) => {
                    if(res.status_code === 200){
                        if(isFast){
                            if(default_collection === state.notes.collection_id){
                                commit("ADD_NOTE", { note_type: noteType, data: res.data })
                            }
                        }else{
                            commit("ADD_NOTE", { note_type: noteType, data: res.data })
                        }

                        // 判断是否有新的tag添加了进来
                        if(res.data.tags.length > 0){
                            setTimeout(() => {
                                dispatch("getTagsList")
                                dispatch("getTagsAllList")
                                dispatch("getGroupInitial")
                            }, 500)
                        }
                        resolve(res)
                    }
                })
            })
        },

        // 删除笔记列表
        removeNote({commit, dispatch, rootState}, params){
            const user_id = rootState.user.userInfo.id
            const note_id = params.id
            const note_type = params.note_type
            const index = params.index

            return new Promise((resolve, reject) => {
                request({
                    api: 'removeNoteApi',
                    key: "removeNoteApi",
                    data: {user_id, note_id}
                }, (res) => {
                    resolve(res)
                    if(res.status_code === 200){
                        commit("REMOVE_NOTE", {index, note_type})

                        dispatch("getTagsList")
                        dispatch("getTagsAllList")
                        dispatch("getGroupInitial")
                    }
                })
            })
        },

        // 修改长笔记的笔记本
        changeWriteNoteCollection({commit, dispatch, rootState}, {note_id, collection_id, index}){
            return new Promise(resolve => {
                request({
                    key: 'changeCollectionApi',
                    api: "changeCollectionApi",
                    data: {
                        user_id: rootState.user.userInfo.id,
                        note_id,
                        collection_id
                    }
                }, (res) => {
                    if(res.status_code){
                        commit("REMOVE_NOTE", { index, note_type: 2 })
                        ElNotification.success("转移成功")
                        resolve(res)
                    }else{
                        ElNotification.warning("转移失败")
                    }
                })
            })

        },

        // 修改笔记
        editNote({commit, dispatch, rootState}, params){
            debounceFun(handleRestructureConfig, 500) // 检测config.json格式

            const { tag_list, contentHtml }  = handleContentHtml(params.html)

            const user_id = rootState.user.userInfo.id
            const note_id = params.noteId
            const collection_id = params.collection_id
            const content = contentHtml
            const postil_list = params.postil_list
            const { list } = tagService.tagTool.json2Tree(params.json)
            const struct_list = tagService.tagTool.filterTreeKey(list)

            return new Promise((resolve, reject) => {
                request({
                    api: 'editNoteApi',
                    key: 'editNoteApi',
                    data: {user_id, note_id, collection_id, content, postil_list, tag_list, struct_list}
                }, (res) => {
                    if(res.status_code === 200){
                        commit('EDIT_NOTE', { data: res.data, index: params.index, noteType: params.noteType })
                        commit('REMOVE_EDIT_NOTE_OBJ', { note_id: params.noteId })
                        if(res.data.tags.length > 0){
                            dispatch("getTagsList")
                            dispatch("getTagsAllList")
                            dispatch("getGroupInitial")
                        }
                        resolve(res)
                    }else{
                        reject(res)
                    }
                })
            })
        },

        // 分享笔记
        shareNote({commit},params){
            return new Promise((reslove, reject) => {
                // request({
                //     api: 'shareNoteApi',
                //     key: 'shareNoteApi',
                //     data: {
                //         note_id: params.note_id
                //     }
                // }, (res) => {
                //     if(res.code === 200){
                //         console.log(res);
                //     }
                // })
            })
        },

        // 回收站恢复笔记
        recoverNote({commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'restoreTrashNoteApi',
                    key: 'restoreTrashNoteApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        note_id: params.note_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("REMOVE_NOTE", {
                            index: params.index,
                            note_type: params.note_type
                        })
                    }
                    resolve(res)
                })
            })
        },
        // 回收站删除笔记
        deleteNote({commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'delTrashNoteApi',
                    key: 'delTrashNoteApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        note_id: params.note_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("REMOVE_NOTE", {
                            index: params.index,
                            note_type: params.note_type
                        })
                        resolve(res)
                    }
                })
            })
        },

        // 获取collection下的tags
        async getTagsList({state, commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'getTagListApi',
                    key: 'getTagListApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection_id: state.notes.collection_id,
                        note_type: state.catalogActiveState.noteTypeActive
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_LIST", res.data)
                    }
                })
            })
        },
        // 获取所有标签
        async getTagsAllList({state, commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'getTagListApi',
                    key: 'getAllTagListApi',
                    data: {
                        user_id: rootState.user.userInfo.id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_ALL_LIST", res.data)
                    }
                })
            })
        },
        // 获取标签组
        async getTagsGroup({state, commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'getGroupListApi',
                    key: 'getGroupListApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        collection_id: state.notes.collection_id
                    }
                }, (res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_GROUP", res.data)
                    }
                })
            })
        },

        // 根据分母获取标签
        getGroupInitial({state, commit, rootState}, params){
            return new Promise((resolve, reject) => {
                let data = {
                    user_id: rootState.user.userInfo.id,
                    collection_id: state.notes.collection_id,
                    keyword: params?.keyword || '',
                    note_type: state.catalogActiveState.noteTypeActive
                }
                request({
                    api: 'getGroupInitialApi',
                    key: 'getGroupInitialApi',
                    data
                }, (res) => {
                    if(res.status_code === 200){
                        commit('SET_TAG_INITIAL_LIST', res.data)
                        resolve(res.data)
                        ipcRenderer.send('sendParamsTagManage', res.data)
                    }
                })
            })
        },

        // 废纸篓根据分母获取标签
        getGroupTrashInitial({state, commit, rootState}, params){
            return new Promise((resolve, reject) => {
                let data = {
                    user_id: rootState.user.userInfo.id,
                    collection_id: '',
                    keyword: params?.keyword || '',
                    note_type: state.catalogActiveState.noteTypeActive
                }
                request({
                    api: 'getGroupTrashInitialApi',
                    key: 'getGroupTrashInitialApi',
                    data
                }, (res) => {
                    if(res.status_code === 200){
                        commit('SET_TAG_INITIAL_LIST', res.data)
                        ipcRenderer.send('sendParamsTagManage', res.data)
                    }
                })
            })
        },


        // 置顶标签
        setTopTags({commit, rootState}, params){
            const data = {
                user_id: rootState.user.userInfo.id,
                tag_id: params.tag_id
            }
            return new Promise(resolve => {
                request({
                    api: 'setTagTopApi',
                    key: 'setTagTopApi',
                    data
                }, (res) => {
                    resolve(res)
                    if(res.status_code === 200){
                        commit("SET_TOP_TAGS", params.tag_id)
                    }
                })
            })

        },

        // 取消置顶标签
        removeTopTags({commit, rootState}, params){
            return new Promise(resolve => {
                request({
                    api: 'setTagNormalApi',
                    key: 'setTagNormalApi',
                    data: {
                        user_id: rootState.user.userInfo.id,
                        tag_id: params.tag_id
                    }
                }, (res) => {
                    resolve(res)
                    if(res.status_code === 200){
                        commit("REMOVE_TOP_TAGS", params.tag_id)
                    }
                })
            })
        }
    }
}

function handleNoteImg(note){
    note.curtNote = note.note
    let imgArr = note.note.match(imgReg)
    let imgSrc = []
    if(imgArr && imgArr.length){
        imgSrc = imgArr.map(src => src.match(srcReg)[1])
        imgArr.forEach((img) => {
            note.curtNote = note.curtNote.replace(img, '')
        })
    }
    note.imgSrc = imgSrc

    return note
}


