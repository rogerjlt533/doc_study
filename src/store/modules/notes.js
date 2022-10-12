import { shareNoteApi } from "@/api/notes"
import { removeHtmlTag, deepClone } from '@/utils/tools'
// import { getHtmlToJson } from "@/views/Home/components/HomeNotes/js/writeEditor"
import { getNotesApi, newNoteApi, removeNoteApi, editNoteApi } from '@/apiDesktop/notes'
import { getTagListApi, getGroupListApi, setTagTopApi, setTagNormalApi, getGroupInitialApi } from '@/apiDesktop/tag'
import { delTrashNoteApi, restoreTrashNoteApi } from '@/apiDesktop/trash'
import { handleRestructureConfig } from '@/assets/js/restructureConfig'
import { debounceFun } from '@/utils/tools'
import {ElMessageBox} from "element-plus";
import bus from '@/utils/bus';
import {isPromise} from "@electron/remote/dist/src/common/type-utils";

const tagService = require('service/service/tag');

export default {
    namespaced: true,
    state: {
        cachedNote: "",
        notesListHeight: "calc(100vh - 208px)",
        catalogState: {
            showSelfCollection: false,
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
            long_note_count: 0
        },
        notes: {
            tag_id: '',
            group_id: '',
            collection_id: '',
            trash: '',
            note_type: 1,
            orderby_create: 1,
            sort: "desc"
        },
        writeNoteState: {
            active: '',
            note: '',
            collection_id: ''
        },
        // 记录时的collection
        // editorCollection:{
        //     checked_collection: "",
        //     collection_id: "",
        // },
        // 选中笔记本时 筛选对应tag 所以记录一下collection-id
        tagToCollectionId: "",
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
        isFinish: true
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
            state.notesListHeight = `calc(100vh - ${data + 96}px)`
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
        CHANGE_CATALOG_ACTIVE_STATE(state, { noteTypeActive, collectionActive, tagActive, tagGroupActive, trashActive, collectionTitle, tagTitle, tagGroupTitle, short_note_count, long_note_count }){
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
        },
        // 设置笔记本筛选条件的参数
        CHANGE_FILTER_NOTE_PARAMS(state, { trash, collection_id, tag_id, group_id, note_type, orderby_create, sort }){
            console.log('note_type', note_type)
            state.notes.trash = trash === undefined ? state.notes.trash : trash
            state.notes.collection_id = collection_id === undefined ? state.notes.collection_id : collection_id
            state.notes.tag_id =  tag_id === undefined ? state.notes.tag_id : tag_id
            state.notes.group_id =  group_id === undefined ? state.notes.group_id : group_id
            state.notes.note_type =  note_type === undefined ? state.notes.note_type : note_type
            state.notes.orderby_create =  orderby_create === undefined ? state.notes.orderby_create : orderby_create
            state.notes.sort =  sort === undefined ? state.notes.sort : sort
        },
        // 设置写作笔记的状态
        SET_WRITE_NOTE_STATE(state, { active }){
            state.writeNoteState.active = active
        },
        // collection切换顺序时，修改选中collection的index
        SORT_CHANGE_COLLECTION_ACTIVE(state, { collectionActive }){
            state.catalogActiveState.collectionActive = collectionActive
        },
        /**
         * 记录笔记的collection
         * 声明:
         * 1. collection的id是必选的, 因为记录笔记时一定要有默认记录的collection;
         * 2. collection的name也是必选的, 给用户使用时要告诉用户当前是哪个collection;
         * 牵扯筛选笔记时可能也有collection_id, 所以单独拿出一套collection来给添加笔记接口使用
         */
        // RECORD_COLLECTION(state, { collection_id = "", checked_collection = ""}){
        //     state.editorCollection.checked_collection = checked_collection === undefined ? state.editorCollection.checked_collection : checked_collection;
        //     state.editorCollection.collection_id = collection_id === undefined ? state.editorCollection.collection_id : collection_id;
        // },

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
        ADD_NOTE(state, {note_type, data}){
            if(state.notes.trash) return
            if(note_type === 1){
                state.notes.sort === "desc" ? state.noteslist.unshift(data) : state.noteslist.push(data)
                state.catalogActiveState.short_note_count ++
                return
            }
            if(note_type === 2){
                data.desc = removeHtmlTag(data.note)
                state.catalogActiveState.long_note_count --
                state.notes.sort === "desc" ? state.writeNotesList.unshift(data) : state.writeNotesList.push(data)
            }
        },
        REMOVE_NOTE(state, {index, note_type}){
            console.log(index, note_type)
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
        EDIT_NOTE(state, {data, index, noteType = 1}){
            if(noteType === 2){
                data.desc = removeHtmlTag(data.note)
                Object.keys(state.writeNotesList[index]).forEach((key) => {
                    state.writeNotesList[index][key] = data[key]
                })
            }else{
                Object.keys(state.noteslist[index]).forEach((key) => {
                    state.noteslist[index][key] = data[key]
                })
            }
        },
        SET_NOTESlIST_IF_DOWN(state, data){
            state.isFinish = data;
        },
        RECOVERY_NOTE(state, data){
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

        // 历史笔记恢复
        RECOVERY_HISTORY(state, data){
            let index = state.noteslist.findIndex(item => item.id == data.id);
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
            const size = 50
            let params = {
                tag_id: state.notes.tag_id,
                group_id: state.notes.group_id,
                keyword: data.keyword,
                collection_id: state.notes.collection_id,
                today: undefined,
                orderby_create: state.notes.orderby_create,
                sort: state.notes.sort,
                start_time: data.start_time,
                end_time: data.end_time,
                note_type: 1
            }
            const noteParams = {
                user_id: rootState.user.userInfo.id,
                params: null,
                trash: state.notes.trash,
                page: data.page || 1,
                size: data.page === 1 ? 20 : size
            }

            return new Promise((resolve, reject) => {
                noteParams.params = deepClone(params)
                getNotesApi(noteParams).then((res) => {
                    if(res.status_code === 200){
                        let list = res.data.note || []
                        let count = res.data.count

                        // 判断是否列表结束
                        let pageSize = data.page === 1 ? 20 : size
                        commit("SET_NOTESlIST_IF_DOWN", !(list.length < pageSize))
                        commit("SET_NOTES_LIST", {
                            list,
                            count
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
                orderby_create: state.notes.orderby_create,
                sort: state.notes.sort,
                start_time: data.start_time,
                end_time: data.end_time,
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
                getNotesApi(noteParams).then((res) => {
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

                        resolve(res)
                    }
                })
            })
        },

        // 添加笔记
        async addNotes({state, commit, dispatch, rootState}, { contentJson, contentHtml, annotation_id, note_type, tag_list }){
            debounceFun(handleRestructureConfig(), 500) // 检测本地config.json文件格式
            if(!state.notes.collection_id){
                ElMessageBox.confirm('保存失败，因为您还没有指定记录的笔记本~~', {
                    type: 'error',
                    cancelButtonText: '知道了',
                    confirmButtonText: '马上新建'
                }).then(() => {
                    bus.emit('ADD_COLLECTION')
                })
                return false
            }

            const user_id = rootState.user.userInfo.id
            const collection_id = state.notes.collection_id
            const noteType = note_type || 1
            const source = "desktop"
            const content = contentHtml
            const url = ''
            const postil_list = [ annotation_id ]
            const { list } = tagService.tagTool.json2Tree(contentJson)
            const struct_list = tagService.tagTool.filterTreeKey(list)

            const res = await newNoteApi({user_id, collection_id, noteType, source, content, url, postil_list, tag_list, struct_list})
            if(res.status_code === 200){
                commit("ADD_NOTE", {note_type: noteType, data: res.data})
                // 判断是否有新的tag添加了进来
                if(res.data.tags.length > 0){
                    // commit("ADD_NEW_TAGS", res.data.tags)
                    dispatch("getTagsList")
                    dispatch("getTagsAllList")
                    dispatch('getTagsGroup')
                }
                return res
            }

        },

        // 删除笔记列表
        async removeNote({commit, dispatch, rootState}, params){
            const user_id = rootState.user.userInfo.id
            const note_id = params.id
            const note_type = params.note_type
            const index = params.index
            const res = await removeNoteApi({user_id, note_id})
            if(res.status_code === 200){
                commit("REMOVE_NOTE", {index, note_type})
                dispatch("getTagsList")
                dispatch("getTagsAllList")
                dispatch('getGroupInitial')
                return true
            }
        },

        // 修改笔记
        editNote({commit, dispatch, rootState}, params){
            debounceFun(handleRestructureConfig(), 500) // 检测config.json格式

            const user_id = rootState.user.userInfo.id
            const note_id = params.noteId
            const collection_id = params.collection_id
            const content = params.contentHtml
            const postil_list = params.postil_list
            const tag_list = params.tag_list
            const { list } = tagService.tagTool.json2Tree(params.contentJson)
            const struct_list = tagService.tagTool.filterTreeKey(list)

            return new Promise((resolve, reject) => {
                editNoteApi({user_id, note_id, collection_id, content, postil_list, tag_list, struct_list}).then((res) => {
                    if(res.status_code === 200){
                        commit('EDIT_NOTE', { data: res.data, index: params.index, noteType: params.noteType })
                        if(res.data.tags.length > 0){
                            dispatch("getTagsList")
                            dispatch("getTagsAllList")
                            dispatch('getTagsGroup')
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
                shareNoteApi({
                    note_id: params.note_id
                }).then((res) => {
                    if(res.code === 200){
                        console.log(res);
                    }
                })
            })
        },

        // 回收站恢复笔记
        async recoverNote({commit, rootState}, params){
            const res = await restoreTrashNoteApi({
                user_id: rootState.user.userInfo.id,
                note_id: params.note_id
            })
            if(res.status_code === 200){
                commit("REMOVE_NOTE", {
                    index: params.index,
                    note_type: params.note_type
                })
            }
        },
        // 回收站删除笔记
        async deleteNote({commit, rootState}, params){
            const res = await delTrashNoteApi({
                user_id: rootState.user.userInfo.id,
                note_id: params.note_id
            })
            if(res.status_code === 200){
                commit("REMOVE_NOTE", {
                    index: params.index,
                    note_type: params.note_type
                })
            }
        },

        // 获取collection下的tags
        async getTagsList({state, commit, rootState}, params){
            return new Promise(resolve => {
                getTagListApi({
                    user_id: rootState.user.userInfo.id,
                    collection_id: state.notes.collection_id
                }).then((res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_LIST", res.data)
                    }
                })
            })
            // const res = await getTagListApi({
            //     user_id: rootState.user.userInfo.id,
            //     collection_id: state.notes.collection_id
            //     // collection_id: state.tagToCollectionId
            // })
            // console.log("获取tag接口", res)
            // if(res.status_code === 200){
            //     commit("SET_TAGS_LIST", res.data)
            // }
        },
        // 获取所有标签
        async getTagsAllList({state, commit, rootState}, params){
            return new Promise(resolve => {
                getTagListApi({
                    user_id: rootState.user.userInfo.id
                }).then((res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_ALL_LIST", res.data)
                    }
                })
            })
            // const res = await getTagListApi({
            //     user_id: rootState.user.userInfo.id
            // })
            // console.log("获取tag ALL接口")
            // if(res.status_code === 200){
            //     commit("SET_TAGS_ALL_LIST", res.data)
            // }
        },
        // 获取标签组
        async getTagsGroup({state, commit, rootState}, params){
            return new Promise(resolve => {
                getGroupListApi({
                    user_id: rootState.user.userInfo.id,
                    collection_id: state.notes.collection_id
                }).then((res) => {
                    if(res.status_code === 200){
                        commit("SET_TAGS_GROUP", res.data)
                    }
                })
            })
            // const res = await getGroupListApi({
            //     user_id: rootState.user.userInfo.id,
            //     collection_id: state.notes.collection_id
            //     // collection_id: state.tagToCollectionId
            // })
            // console.log("获取tag group 接口", res)
            // if(res.status_code === 200){
            //     commit("SET_TAGS_GROUP", res.data)
            // }
        },

        // 根据分母获取标签
        getGroupInitial({state, commit, rootState}, params){
            return new Promise((resolve, reject) => {
                let data = {
                    user_id:  rootState.user.userInfo.id,
                    collection_id: state.notes.collection_id,
                    keyword: params?.keyword || ''
                }
                getGroupInitialApi(data).then((res) => {
                    if(res.status_code === 200){
                        commit('SET_TAG_INITIAL_LIST', res.data)
                    }
                })
            })
        },


        // 置顶标签
        async setTopTags({commit}, params){
            console.log('setTP',params)
            const res = await setTagTopApi(params)
            console.log('setTP',res)
            if(res.status_code === 200){
                commit("SET_TOP_TAGS", params.tag_id)
            }
        },

        // 取消置顶标签
        async removeTopTags({commit}, params){
            console.log('setTP',params)
            const res = await setTagNormalApi(params)
            console.log('setTP',res)
            if(res.status_code === 200){
                commit("REMOVE_TOP_TAGS", params.tag_id)
            }
        },
    }
}

function getNoteIntroduction(item, index = 0){
    item.desc = removeHtmlTag(item.note)

    // if(!removeHtmlTag(item.note).trim()){
    //     item.title = ''
    //     item.desc = ''
    //     return false
    // }
    // const htmlJson = getHtmlToJson(item.note)
    // item.title = htmlJson.content[0].content && htmlJson.content[0].content[0] ? htmlJson.content[0].content[0].text : ''
    // item.desc = removeHtmlTag(item.note, ' ').replace(item.title, '')
}


