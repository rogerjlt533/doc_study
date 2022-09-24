<template>
    <div class="topbar">
        <div class="info flex align-center">
            <span class="mr10 line-1">{{trashActive ? '废纸篓' : nowNotes}}</span>
            <font-awesome-icon class="font-14 cursor-p" :class="[!ifRefresh ? 'is_loading' : '']" @click="debounceFun(refreshList)" icon="sync-alt" color="#9EA0AD" />
            <div class="knowledge-graph ml10" v-if="!trashActive && nowNotes" @click="showKnowledgeGraph">
                <svgFont icon="knowledgeGraph" class=" color-9"></svgFont>
            </div>
            <div class="clear-trash ml20" v-if="trashActive" @click="cleanTrash">
                <span>清空</span>
                <font-awesome-icon class="font-icon font-12" icon="trash-alt" color="#FF6347" />
            </div>
        </div>
        <div class="filter">
            <div class="font-12 color-9 pr20">
                <span @click="changeMaxNum">卡片总数：{{ notesCount }}</span>
                <template v-if="!trashActive">
                    <el-tooltip v-if="ifChangeMaxNum" content="为你的卡片笔记设置的容量大小，双击可以修改" placement="bottom">
                        <span @dblclick="changeMaxNum" class="cursor-p"> / {{ notesMaxNum }}</span>
                    </el-tooltip>
                    <template v-else>
                        / <input class="input-num" ref="maxNumInputRef" v-model="notesMaxNum" type="number" @blur="setMaxNum" @keyup.enter="$event.target.blur()">
                    </template>
                    <span class="block ml10" :class="statusClass"></span>
                </template>
            </div>
            <el-dropdown trigger="click">
                <span class="el-dropdown-link mr10">
                    {{sortDefault.label}}
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                                v-for="item in filterList"
                                :key="item.value"
                                @click="changeFilter(item)"
                                :class="[item.label === sortDefault.label ? 'activeFilter' : '']"
                        >
                            {{item.label}}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>

    <template v-if="notesList.length > 0">
        <el-scrollbar ref="notesListRef" :height="finallyHeight" :always="false">
            <div class="container"
                 v-infinite-scroll="loadPage"
                 :infinite-scroll-immediate="false"
                 :infinite-scroll-distance="30"
            >
                <template v-for="(item,index) in notesList" :key="item.id">
                    <div
                            class="content-list"
                            v-show="!item.ifEditCon"
                            @dragover="dropNoteFun.handleDragover($event, item)"
                            @dragenter="dropNoteFun.handleDragenter($event, item)"
                            @dragleave="dropNoteFun.handleDragleave($event, item)"
                    >
                        <div v-show="item.is_self === 1 && item.showMarks && item.note_type === 1" class="marks flex">
                            <div class="marks-left" v-if="!item.showMarksLeft" @drop="dropNoteFun.handleDrop(item, 'merge')">
                                <div>
                                    <font-awesome-icon icon="code-merge" color="#ffffff" style="font-size: 26px;margin-bottom: 6px" />
                                    <p>放开拖拽以合并笔记</p>
                                </div>
                            </div>
                            <div class="marks-right" @drop="dropNoteFun.handleDrop(item, 'quote')">
                                <div>
                                    <font-awesome-icon icon="quote-left" color="#ffffff" style="font-size: 26px;margin-bottom: 6px" />
                                    <p>放开拖拽以引用笔记</p>
                                </div>
                            </div>
                        </div>
                        <!--短笔记-->
                        <template v-if="item.note_type === 1">
                            <shortNotesItem
                                    :item="item"
                                    :index="index"
                                    :isTrash="isTrash"
                                    @deleteNote="deleteNote"
                                    @dragstart="dropNoteFun.handlerDragstart(item, index)"
                            />
                            <NoteAnnotation
                                    v-for="(quote,qi) in item.quote"
                                    :key="quote.id"
                                    :data="quote"
                                    :edit="true"
                                    class="ml10 mr10"
                                    @close="closeQuote(item, qi)"
                            ></NoteAnnotation>
                        </template>
                    </div>
                    <div v-if="item.ifEditCon" class="mb20">
                        <home-notes-editor
                                ref="notesEditorChild"
                                :item="item"
                                :content="item.note"
                                :index="index"
                                :edit="true"
                                :noteId="item.id"
                                :collectionId="item.collection_id"
                                @editNotesContent="closeEdit(item)"
                        />
                    </div>
                </template>
                <el-divider>
                    <span v-if="isFinish" style="color:#999">加载更多 ~ </span>
                    <span v-else style="color: #999999; font-style: italic;">Organized your digital life</span>
                </el-divider>
            </div>
        </el-scrollbar>
    </template>
    <el-empty v-else description="方寸笔迹 · Organized your digital life"></el-empty>
</template>

<script setup>
    import {ref, nextTick, computed, reactive, defineAsyncComponent, onBeforeUnmount} from "vue";
    import { useStore } from "vuex"
    // hooks -----
    import { clearTrashNoteApi } from "@/apiDesktop/trash";
    import { removePostilApi } from "@/apiDesktop/notes";
    import { setMaxNumApi } from "@/apiDesktop/collection";
    import dropNoteFun from "./js/dropNote"
    import bus from '@/utils/bus'
    import { debounceFun } from "@/utils/tools"
    // 组件 -----
    import { Search, ArrowDown, Loading } from '@element-plus/icons-vue'
    import { ElMessageBox, ElNotification } from "element-plus"

    // 异步组件 -----
    const HomeNotesEditor = defineAsyncComponent(() => import('./Editor.vue'))
    const shortNotesItem = defineAsyncComponent(() => import('./components/shortNotesItem.vue'))
    const NoteAnnotation = defineAsyncComponent(() => import('./components/NoteAnnotation.vue'))

    const store = useStore();
    // 监听用户筛选Notes下的笔记
    let notesListRef = ref(null)
    let trashActive = computed(() => store.state.notes.catalogActiveState.trashActive)
    let nowNotes = computed(() => {
        let collectionTitle = store.state.notes.catalogActiveState.collectionTitle || ''
        let groupTitle = store.state.notes.catalogActiveState.tagGroupTitle || ''
        let tagTitle = store.state.notes.catalogActiveState.tagTitle || ''

        return `${collectionTitle}${groupTitle ? collectionTitle ? '/' + groupTitle : groupTitle : ''}${tagTitle ? groupTitle || collectionTitle ? '/' + tagTitle : tagTitle : ''}`
    })
    // 根据编辑框高度动态修改列表的高度;
    let finallyHeight = computed(() => store.state.notes.notesListHeight )
    // 当前笔记分类参数
    let isFinish = computed(() => store.state.notes.isFinish )
    let isTrash = computed(() => store.state.notes.notes.trash )
    let notesList = computed(() => store.state.notes.noteslist )
    let notesCount = computed(() => store.state.notes.catalogActiveState.short_note_count )
    let setMaxTimer = null
    let notesMaxNum = computed({
        get(){
            let collectionActive = store.state.notes.catalogActiveState.collectionActive
            let collection = store.state.collection.projectListSelf.find(item => item.id === collectionActive)
            return collection ? collection.max_num : 0
        },
        set(val){
            let collectionActive = store.state.notes.catalogActiveState.collectionActive
            store.commit('collection/SET_COLLECTION_MAX_NUM', { collectionActive, val })
        }
    })
    let statusClass = computed(() => {
        let number = Math.floor( (notesCount.value / notesMaxNum.value) * 100 )
        let style = ''
        if( number < 60 ){
            style = 'block-success'
        } else if ( number > 90 ) {
            style = 'block-error'
        } else {
            style = 'block-warning'
        }
        return style
    })

    // 翻页的页数
    let page = 1

    // 刷新笔记列表
    let ifRefresh = ref(true);
    function refreshList(){
        ifRefresh.value = false;
        notesListRef.value?.setScrollTop(0)
        bus.emit('clearSearchKeyword')
    }
    // 搜索笔记列表方法
    bus.on('handleSearchNote', (e) => {
        getNotesList({
            keyword: e.keyword,
            start_time: e.start_time,
            end_time: e.end_time
        })
    })
    bus.on("clearSearchKeyword", () => {
        page = 1
        getNotesList({})
    })
    bus.on("handleMakeListTop", () => {
        nextTick(() => {
            notesListRef.value?.setScrollTop(0)
        })
    })

    // 筛选笔记方法
    let filterList = [
        {
            label: "创建时间 ↓",
            value: "desc",
            orderby_create: 1,
            icon: 'arrow-down-1-9'
        },{
            label: "创建时间 ↑",
            value: "asc",
            orderby_create: 1,
            icon: 'arrow-down-9-1'
        },{
            label: "更新时间 ↓",
            value: "desc",
            orderby_create: 0,
            icon: 'arrow-down-1-9'
        },{
            label: "更新时间 ↑",
            value: "asc",
            orderby_create: 0,
            icon: 'arrow-down-9-1'
        }
    ]
    let sortDefault = reactive({
        label: "更新时间 ↓",
        value: "desc",
        orderby_create: 0,
        icon: 'arrow-down-1-9'
    })

    filterList.forEach(item => {
        if(store.state.notes.notes.sort === item.value){
            sortDefault.label = item.label
        }
    })
    function changeFilter(e){
        store.commit("notes/CHANGE_FILTER_NOTE_PARAMS",{
            orderby_create: e.orderby_create,
            sort: e.value
        })
        sortDefault.label = e.label
        getNotesList({})
    }

    // 设置最大笔记数
    let ifChangeMaxNum = ref(true)
    let maxNumInputRef = ref(null)
    function changeMaxNum(){
        ifChangeMaxNum.value = false
        setTimeout(() => maxNumInputRef.value.focus())
    }
    function setMaxNum(){
        let collectionActive = store.state.notes.catalogActiveState.collectionActive
        ifChangeMaxNum.value = true
        setMaxNumApi({
            user_id: store.state.user.userInfo.id,
            collection_id: collectionActive,
            max_num: notesMaxNum.value
        })
    }

    // 编辑该笔记
    const notesEditorChild = ref(null)
    function closeEdit(item){
        item.ifEditCon = false
    }

    // 关闭笔记引用
    function closeQuote(item, i){
        ElMessageBox.confirm('确定删除该引用吗？',{
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
        }).then(async () => {
            let ids = []
            item.quote.forEach(q => {
                if(item.quote[i].id !== q.id){
                    ids.push(q.id)
                }
            })
            let data = {
                note_id: item.id,
                postil_id: ids
            }
            const res = await removePostilApi(data)
            if(res.status_code === 200){
                store.commit('notes/RECOVERY_NOTE',res.data.note)
            }
        }).catch()
    }

    // 查询笔记列表
    function getNotesList({ page = 1, keyword = undefined, start_time = undefined, end_time = undefined }){
        if(page === 1) store.commit("notes/RESET_NOTES_LIST")
        store.dispatch("notes/getShortNotesList",{
            page, keyword, start_time, end_time
        }).then((res) => {
            ifRefresh.value = true
            store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
                short_note_count: res.data.count || 0
            })
        })
        if(page === 1){
            store.dispatch('notes/getWriteNotesList',{
                page, keyword, start_time, end_time
            }).then((res) => {
                bus.emit('readWriteNoteData')
                store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
                    long_note_count: res.data.count || 0
                })
            })
        }
    }

    // 监听列表滚动
    function loadPage(){
        if(isFinish.value){
            page ++
            getNotesList({page})
        }
    }

    // 监听删除note
    function deleteNote(){
        if(isFinish.value && notesList.value.length < 10){
            page ++;
            getNotesList({page})
        }
    }

    // 展示知识图谱
    function showKnowledgeGraph(){
        bus.emit('showKnowledgeGraph')
    }

    // 清倒废纸篓
    function cleanTrash(){
        ElMessageBox.confirm("确定清除废纸篓中的所有笔记吗？", {
            type: 'warning',
            confirmButtonText: "确定删除",
            cancelButtonText: "取消"
        }).then(async () => {
            const res = await clearTrashNoteApi({
                user_id: store.state.user.userInfo.id
            })
            if(res.status_code === 200){
                ElNotification.success("删除成功")
                store.commit("notes/RESET_NOTES_LIST")
                store.dispatch("user/getUserBase")
            }
        }).catch(()=>{})
    }

    // 组件销毁前移除所有的监听
    onBeforeUnmount(() => {
        bus.off('handleSearchNote')
        bus.off('clearSearchKeyword')
        bus.off('handleMakeListTop')
    })
</script>

<style lang="scss">
    .activeFilter{
        color: $purple;
        background-color: rgba(120, 133, 209, 0.1) !important
    }
    .el-scrollbar__bar{
        display: none !important;;
    }
</style>

<style lang="scss" scoped>
    .topbar{
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;
        .info{
            padding: 0 10px;
            span{
                font-weight: 700;
                font-size: 16px;
                color: #333;
                display: inline-block;
                max-width: 300px;
                vertical-align: bottom;
            }
            i{
                font-size: 18px;
                color: #999;
                cursor: pointer;
            }
            .knowledge-graph{
                padding: 0 4px;
                border-radius: 4px;
                cursor: pointer;
                transition: all .3s;
                &:hover{
                    background: #f5f5f5;
                }
                &:active{
                    background: #eeeeee;
                }
            }
            .clear-trash{
                display: flex;
                align-items: center;
                padding: 2px 2px 2px 6px;
                background: #eeeeee;
                border-radius: 4px;
                cursor: pointer;
                &:hover{
                    background: #cccccc;
                }
                span{
                    font-size: 12px;
                    font-weight: 400;
                    color: #FF6347;
                }
            }
        }
        .filter{
            display: flex;
            align-items: center;
            .el-dropdown-link {
                cursor: pointer;
                color: #999999;
                font-size: 12px;
                display: flex;
                align-items: center;
                margin-left: 10px;
            }
            .input-num{
                width: 22px;
                height: 10px;
                line-height: 10px;
                color: #999999;
                border: 1px solid #999999;
                border-radius: 2px;
                font-size: 12px;
                &::-webkit-outer-spin-button,
                &::-webkit-inner-spin-button {
                    -webkit-appearance: none !important;
                    margin: 0;
                }
                &[type="number"] {
                    -moz-appearance: textfield;
                }
            }
            .block{
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 4px;
            }
            .block-success{
                background: $success;
            }
            .block-warning{
                background: $warning;
            }
            .block-error{
                background: $error;
            }
        }
    }
    .container{
        &::-webkit-scrollbar {
            display: none;
        }
        .content-list{
            position: relative;
            background: #F6F8FC;
            border-radius: 4px;
            margin-bottom: 20px;
            padding: 10px 0px;
            overflow: hidden;
            transition: all .3s;
            &:hover{
                box-shadow: 0 4px 10px -8px rgba($color: #000000, $alpha: 0.6);
            }
            .marks{
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: rgba(0, 0, 0, .5);
                z-index: 99;
                line-height: 100%;
                .marks-left{
                    border-right: 1px solid #ffffff;
                }
                .marks-left, .marks-right{
                    position: relative;
                    width: 100%;
                    div{
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        color: #ffffff;
                        font-size: 14px;
                        text-align: center;
                    }
                }
            }
        }
        .max-hieght{
            max-height: 220px;
            overflow: hidden;
        }
        .empty{
            margin-top: 20vh;
            text-align: center;
            color: #999999;
            font-size: 12px;
        }
    }


    .transition-list-enter-active {
        transform: translateY(-100px);
        transition: all 0.5s;
    }
    .transition-list-enter-to {
        transform: translateY(0px);
    }
</style>