<template>
    <div class="home" id="homeBox">
        <div class="home-left" :style="{ paddingTop: catalogPaddingTop, height: `calc(100vh - ${catalogPaddingTop})` }">
            <div class="home-menu" id="homeLeft">
                <collection-menu />
                <tags-menu />
            </div>
            <div class="trash-btn unselectable" :class="trashActive ? 'active' : '' " @click="showTrash">
                <svgFont class="font-16" :color="trashActive ? '#ffffff' : '#6F7A93'" icon="trash"></svgFont>
                <span class="pl6">废纸篓</span>
            </div>
        </div>
        <div id="resizeL"></div>
        <div class="home-right" id="homeRight" :style="{ width: homeWidth }">
            <NoteToolbar></NoteToolbar>
            <transition name="short">
                <div class="short-note" v-show="noteTypeActive === 1">
                    <div v-show="!trashActive">
                        <card-editor ref="editorRef" />
                    </div>
                    <notes-list />
                </div>
            </transition>
            <transition name="write">
                <write-editor v-show="noteTypeActive === 2"></write-editor>
            </transition>
        </div>
    </div>

    <el-dialog
            title="应用更新"
            v-model="showUpdater"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
            top="30vh"
            width="400px"
            center
    >
        <div class="pb20 pl10 pr10 pt6" v-if="downloadProcess">
            <p class="mb10">{{'当前:' + downloadProcess.transferred + '   /   共' + downloadProcess.total}}</p>
            <el-progress color="#6C56F6" :text-inside="true" :stroke-width="18" :percentage="downloadProcess.percent"></el-progress>
            <p class="mt10">正在下载：({{downloadProcess.speed}})</p>
        </div>
    </el-dialog>
</template>

<script setup>
    import {ref, computed, onMounted, defineAsyncComponent, nextTick} from "vue"
    import { useStore } from "vuex"
    import { useRoute, onBeforeRouteLeave } from 'vue-router'
    // hooks
    import bus from '@/utils/bus'
    import { homeWidth, dragControllerDivL } from './components/js/columnDrop'
    import { showUpdater, downloadProcess, handleUpdate } from './components/js/update'
    import { ipcRenderer } from "electron"
    import {getToken} from "@/utils/auth";
    import { hk2tokenApi } from "@/api/tools"

    // 组件
    import CollectionMenu from './components/HomeSidebar/CollectionMenu.vue'
    // 异步组件
    const TagsMenu = defineAsyncComponent(() => import('./components/HomeSidebar/TagsMenu.vue'))
    const CardEditor = defineAsyncComponent(() => import('./components/HomeNotes/cardEditor.vue'))
    const NotesList = defineAsyncComponent(() => import('./components/HomeNotes/NotesList.vue'))
    const writeEditor = defineAsyncComponent(() => import('./components/HomeNotes/writeEditor.vue'))
    const NoteToolbar = defineAsyncComponent(() => import('./components/HomeNotes/NoteToolbar.vue'))

    let store = useStore();
    let route = useRoute();

    // computed ---------------
    let trashActive = computed(() => store.state.notes.catalogActiveState.trashActive)
    let noteTypeActive = computed(() => store.state.notes.catalogActiveState.noteTypeActive)
    const catalogPaddingTop = computed(() => process.platform === 'darwin' ? '50px' : '20px')
    const collectionList = computed(() => store.state.collection.projectListSelf)
    const collectionActive = computed(() => store.state.notes.catalogActiveState.collectionActive)

    // methods --------------
    // 初始化选中collection
    function initData(){
        // 判断刚进入页面是否有缓存的选中的collection，有的话直接用，没有的话使用第一个
        const collection = collectionList.value[0]

        if(!collectionActive.value && !trashActive.value){
            store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
                collection_id: collection ? collection.id : '',
            })
            store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
                collectionActive: collection ? collection.id : '',
                collectionTitle: collection ? collection.collection : '',
            })
        }

        // 清除可能存在的缓存的未保存的笔记
        store.commit("notes/CLEAR_EDITE_NOTE_OBJ")
    }

    // 获取collection 和 用户基础数据
    function getUserData(){
        store.dispatch('user/getUserBase')
        store.dispatch('collection/getCollection').then((res) => {
            initData()
            getNotesList()
            getTags()
        })
    }

    // 获取标签
    function getTags() {
        store.dispatch("notes/getTagsList")
        store.dispatch("notes/getTagsAllList")
    }
    // 获取笔记列表
    function getNotesList(){
        store.dispatch("notes/getShortNotesList",{
            page: 1,
            keyword: undefined
        })
        store.dispatch('notes/getWriteNotesList',{
            page: 1,
            keyword: undefined
        })
    }

    // 监听修改列表高度
    let editorRef = ref(null)
    bus.on('changeNotesListHeight', async (height) => {
        const noteType = store.state.notes.catalogActiveState.noteTypeActive
        if(noteType === 2) return  // 只有卡片模式才会需要修改列表高度
        await nextTick()
        setTimeout(() => {
            let editorBoxHeight = editorRef.value ? editorRef.value.$el.offsetHeight : 0
            store.commit('notes/SET_NOTES_LIST_HEIGHT', height || editorBoxHeight)
        }, 500)
    })

    // 获取废纸篓中的数据
    function showTrash(){
        store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
            collection_id: '',
            group_id: '',
            tag_id: '',
            trash: 1,
        })
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            collectionActive: '',
            collectionTitle: '',
            tagGroupTitle: '',
            tagTitle: '',
            tagActive: '',
            trashActive: 1
        })
        store.commit('notes/SET_NOTES_LIST_HEIGHT',  0)

        store.dispatch("notes/getTagsList")
        store.dispatch('notes/getGroupTrashInitial')
        store.commit("user/SHOW_NOTICE", {data: false})
        bus.emit("clearFilterValue")
        bus.emit("clearSearchKeyword")
        bus.emit("handleMakeListTop")
    }

    // 开启上下行同步
    let timerOne = null
    let timerTwo = null
    function handleStartSync(){
        if(!getToken()) return false
        const params = {
            pub_key: store.state.user.userInfo.pk,
            user_hash: store.state.user.userInfo.user_hash,
            token: getToken()
        }
        ipcRenderer.send('startSyncMain', params)

        syncFunOne()
    }
    function syncFunOne(){
        let startCount = 0
        timerOne = setInterval(() => {
            startCount ++
            store.dispatch('collection/getCollection')
            store.dispatch('user/getUserBase')
            if(startCount > 5){
                clearInterval(timerOne)
                timerOne = null
                syncFunTwo()
            }
        }, 5 * 1000)
    }
    function syncFunTwo(){
        timerTwo = setInterval(() => {
            store.dispatch('collection/getCollection')
            store.dispatch('user/getUserBase')
        }, 20 * 1000)
    }

    // 将 hk 转为token
    function handleHk2token(){
        hk2tokenApi({
            hk: getToken()
        }).then((res) => {
            console.log(res)
            if(res.code === 200){
                store.commit('SET_WEB_TOKEN', res.data.token)
            }
        })
    }


    // mounted ------------
    onMounted( () => {
        handleUpdate()
        getUserData()
        dragControllerDivL()

        handleStartSync()
        handleHk2token()
    })
    // 离开当前路由
    onBeforeRouteLeave((to, from, next) => {
        next()

        clearInterval(timerOne)
        clearInterval(timerTwo)
        timerOne = null
        timerTwo = null

        document.querySelector('body').style.overflow = 'visible'
    })

</script>
<script>
    export default {
        created(){
            document.querySelector('body').style.overflow = 'hidden'
        },
        activated() {
            document.querySelector('body').style.overflow = 'hidden'
        },
    }
</script>

<style lang="scss" scoped>
    .home{
        .home-left{
            position: relative;
            float: left;
            background: #F6F8FC;
            .fold-catalog{
                display: flex;
                flex-direction: row-reverse;
                overflow: hidden;
                padding: 13px 10px;
                -webkit-app-region: drag;
            }
            .home-menu{
                width: 220px;
                max-width: 300px;
                min-width: 160px;
                height: calc(100vh - 100px);
                padding: 0 15px 10px;
                overflow: scroll;
                scrollbar-color: transparent transparent;
                &::-webkit-scrollbar {
                    display: none;
                }
            }
            .trash-btn{
                position: absolute;
                bottom: 18px;
                left: 10px;
                right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #eeeeee;
                color: #6F7A93;
                padding: 8px 10px;
                border-radius: 4px;
                cursor: pointer;
                &:hover{
                    background: #e5e5e5;
                }
                span{
                    font-size: 14px;
                    line-height: 14px;
                }
            }
            .active{
                background: $purple !important;
                color: #FFFFFF !important;
            }
        }

        #resizeL{
            width: 2px;
            background: #F6F8FC;
            cursor: col-resize;
            float: left;
            height: 100vh;
            &:hover{
                transform: scaleX(3);
                background: #f5f5f5;
            }
        }

        .home-right{
            position: relative;
            float: left;
            .short-note{
                width: calc(100% - 20px);
                padding: 10px 10px 0 10px;
            }
        }

        .icon-angles-left{
            color: $purple2;
            font-size: 16px;
            padding: 4px;
            border-radius: 2px;
            &:hover{
                background: rgba($color: $purple, $alpha: 0.1);
            }
        }
    }


    .short-leave-active, .write-leave-active {
        transition: all 0.2s;
        position: absolute;
    }
    .short-enter-active, .write-enter-active {
        transition: all 0.4s;
        position: absolute;
    }
    .short-enter-from, .short-leave-to{
        opacity: 0;
        transform: translateX(-30px);
    }
    .write-enter-from, .write-leave-to{
        opacity: 0;
        transform: translateX(30px);
    }
</style>
<style lang="scss">
    // element-ui
    .el-dropdown-menu__item:not(.is-disabled):hover, .el-dropdown-menu__item:focus{
        background-color: rgba($color: $purple, $alpha: 0.1) !important;
        color: $purple !important;
    }
    .delete{
        .el-dropdown-menu__item:not(.is-disabled):hover, .el-dropdown-menu__item:focus{
            background-color: rgba($color: $error, $alpha: 0.1) !important;
            color: $error !important;
        }
    }
    .el-dropdown-menu{
        .actived{
            background-color: rgba($color: $purple, $alpha: 0.1) !important;
            color: $purple !important;
        }
    }
</style>
