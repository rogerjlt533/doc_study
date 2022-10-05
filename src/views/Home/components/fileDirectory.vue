<template>
    <div class="home" id="homeBox">
        <div class="home-left" v-show="showCatalog">
            <div class="fold-catalog">
                <font-awesome-icon class="icon-angles-left" @click="handleShowCatalog" icon="angles-left" />
            </div>
            <div class="home-menu" id="homeLeft">
                <home-notes-catalog />
                <home-notes-tag />
            </div>
            <div class="trash-btn unselectable" :class="trashActive ? 'active' : '' " @click="showNotes">
                <svgFont class="font-14" :color="trashActive ? '#ffffff' : '#6F7A93'" icon="trash"></svgFont>
                <span class="pl6">废纸篓</span>
            </div>
        </div>
        <div id="resizeL" v-show="showCatalog"></div>
        <div class="home-right" id="homeRight" :style="{ width: showCatalog ? homeWidth : '100%' }">
            <NoteToolbar @switch="changeWriteModel" :isWrite="isWrite"></NoteToolbar>
            <div class="short-note" v-show="!isWrite">
                <home-notes-editor />
                <home-notes-list />
            </div>
            <write-editor v-show="isWrite"></write-editor>
        </div>
    </div>

    <el-dialog
            title="应用更新......"
            v-model="showUpdater"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
            width="450px"
            top="26vh"
            center>
        <template v-if="downloadProcess">
            <p>{{'当前:' + downloadProcess.transferred + '   /   共' + downloadProcess.total}}</p>
            <el-progress :text-inside="true" :stroke-width="18" :percentage="downloadProcess.percent"></el-progress>
            <p>正在下载({{downloadProcess.speed}})......</p>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, computed, onMounted, defineAsyncComponent } from "vue"
    import { useStore } from "vuex"
    import { useRoute } from 'vue-router'
    // hooks
    import bus from '@/utils/bus'
    import { homeWidth, dragControllerDivL } from './components/js/columnDrop'
    import { showCatalog, handleShowCatalog } from './components/HomeSidebar/js/controlShowCatalog'
    import { showUpdater, downloadProcess, handleUpdate } from './components/js/update'
    // 组件
    // import { Delete } from '@element-plus/icons-vue'
    import HomeNotesCatalog from './components/HomeSidebar/Catalog.vue'
    // 异步组件
    const HomeNotesTag = defineAsyncComponent(() => import('./components/HomeSidebar/Tags.vue'))
    const HomeNotesEditor = defineAsyncComponent(() => import('./components/HomeNotes/Editor.vue'))
    const HomeNotesList = defineAsyncComponent(() => import('./components/HomeNotes/NotesList.vue'))
    const writeEditor = defineAsyncComponent(() => import('./components/HomeNotes/writeEditor.vue'))
    const NoteToolbar = defineAsyncComponent(() => import('./components/HomeNotes/NoteToolbar.vue'))

    let store = useStore();
    let route = useRoute();

    // 骨架屏loading
    let loading = ref(false)

    // computed ---------------
    let trashActive = computed(() => store.state.notes.catalogActiveState.trashActive)

    // methods --------------
    // 获取标签
    async function getTags() {
        await store.dispatch("notes/getTagsList")
        await store.dispatch("notes/getTagsAllList")
    }
    // 获取笔记列表
    function getNotesList(){
        store.dispatch("notes/getNotesList",{
            page: 1,
            keyword: undefined,
        }).then(() => {
            loading.value = false
        })
    }

    // 保护 防止列表接口卡主导致页面无法恢复的问题
    function timeoutLoading(){
        setTimeout(() => {
            loading.value = false
        }, 5000)
    }

    // 切换写作模式
    let isWrite = ref(store.state.notes.notes.note_type === 2 )
    function changeWriteModel(){
        isWrite.value = !isWrite.value
        store.commit('notes/FILTER_NOTES_TYPE', { type: isWrite.value ? 2 : 1 })
    }
    // async function addNote(){
    //     let params = {
    //         contentJson: {"type":"doc","content":[{"type":"paragraph"}]} ,
    //         contentHtml: '<p></p>',
    //         note_type: 2
    //     }
    //     const res = await store.dispatch("notes/addNotes", params)
    //     bus.emit("READ_ARTICLE", { item: res.data, index: 0})
    // }
    // function saveWriteNote(){
    //     // bus.emit('SAVE_WRITE_NOTE')
    // }

    function showNotes(){
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

        bus.emit('CHANGE_NOTE_MODE', false)
        setTimeout(()=>{
            store.dispatch("notes/getTagsList")
            store.dispatch('notes/getTagsGroup')
            store.commit("user/SHOW_NOTICE", {data: false})
            bus.emit("CLEAR_KAYWORD");
            bus.emit("MAKE_LIST_TOP");
        })
    }


    // mounted ------------
    onMounted( async() => {
        handleUpdate()

        getTags()
        store.commit("notes/RESET_NOTES_LIST");
        getNotesList()
        timeoutLoading()

        dragControllerDivL()
        // dragControllerDivR()
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
        beforeRouteLeave (to, from, next) {
            document.querySelector('body').style.overflow = 'visible'
            next();
        }
    }
</script>

<style lang="scss" scoped>
    .home{
        display: flex;
        will-change: auto;
        >div{
            flex-shrink: 0;
        }
        .home-left{
            position: relative;
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
            &:hover{
                transform: scaleX(3);
                background: #f5f5f5;
            }
        }

        .home-right{
            min-width: 600px;
            .short-note{
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
