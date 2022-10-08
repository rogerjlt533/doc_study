<template>
    <div class="topbar">
        <div class="info flex align-center">
            <span class="mr10 line-1">{{nowNotes || '废纸篓'}}</span>
            <font-awesome-icon class="font-14 cursor-p" :class="[!ifRefresh ? 'is_loading' : '']" @click="refreshList" icon="sync-alt" color="#9EA0AD" />
            <div class="clear-trash ml20" v-if="nowNotes === '废纸篓'" @click="cleanTrash">
                <span>清空</span>
                <font-awesome-icon class="font-icon" icon="trash-alt" color="#FF6347" style="font-size: 12px" />
            </div>
        </div>
        <div class="filter">
            <span class="font-12 color-9 pr20">笔记总数：{{noteCount}}</span>
            <el-dropdown trigger="click">
                <span class="el-dropdown-link mr10">
                    <!--<font-awesome-icon :icon="sortDefault.icon" class="mr4"></font-awesome-icon>-->
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
                            <!--<font-awesome-icon :icon="item.icon" class="mr4"></font-awesome-icon>-->
                            {{item.label}}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>

    <div v-loading="loadingList">
        <el-scrollbar ref="noteslistRef" :height="finallyHeight" class="mt10" :always="false">
            <div class="container noteslistDom"
                 v-infinite-scroll="loadPage"
                 :infinite-scroll-immediate="false"
                 :infinite-scroll-distance="30"
            >
                <template v-if="noteslist.length > 0">
                    <div
                            v-for="(item,index) in noteslist" :key="item.id"
                            class="content-list"
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
                        <!-- 短笔记-->
                        <template v-if="item.note_type === 1">
                            <shortNotesItem
                                    v-show="!item.ifEditCon"
                                    :item="item"
                                    :index="index"
                                    :isTrash="isTrash"
                                    @deleteNote="deleteNote"
                                    @dragstart="dropNoteFun.handlerDragstart(item, index)"
                            />
                            <home-notes-editor
                                    v-if="item.ifEditCon"
                                    ref="notesEditorChild"
                                    :item="item"
                                    :content="item.note"
                                    :index="index"
                                    :edit="true"
                                    :noteId="item.id"
                                    :collectionId="item.collection_id"
                                    @editNotesContent="closeEdit(item)"
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
                        <!--                        长笔记-->
                        <writeNotesItem
                                v-if="item.note_type === 2"
                                :item="item"
                                :index="index"
                                :isTrash="isTrash"
                        />
                    </div>
                    <el-divider>
                        <template v-if="isFinish">
                            <el-icon v-if="isLoading" class="is_loading"><loading/></el-icon>
                            <span v-else style="color:#999">加载更多 ~ </span>
                        </template>
                        <span v-else style="color: #999999; font-style: italic;">Organized your digital life</span>
                    </el-divider>
                </template>
                <!-- <p class="empty" v-else>方寸笔迹 · Organized your digital life</p> -->
                <el-empty v-else description="方寸笔迹 · Organized your digital life"></el-empty>
            </div>
        </el-scrollbar>
    </div>
</template>

<script setup>
    import {ref, nextTick, computed, reactive, defineAsyncComponent} from "vue";
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // hooks -----
    import { clearTrashNoteApi } from "@/apiDesktop/trash";
    import { removePostilApi } from "@/apiDesktop/notes";
    import dropNoteFun from "./js/dropNote"
    // 组件 -----
    import { Search, ArrowDown, Loading } from '@element-plus/icons-vue'
    import { ElMessageBox, ElNotification } from "element-plus"
    // 异步组件 -----
    const HomeNotesEditor = defineAsyncComponent(() => import('./Editor.vue'))
    const NoteAnnotation = defineAsyncComponent(() => import('./components/NoteAnnotation.vue'))
    const shortNotesItem = defineAsyncComponent(() => import('./components/shortNotesItem.vue'))
    const writeNotesItem = defineAsyncComponent(() => import('./components/writeNotesItem.vue'))

    const store = useStore();

    // 监听用户筛选Notes下的笔记
    let noteslistRef = ref(null);
    let nowNotes = computed(() => {
        let collectionTitle = store.state.notes.catalogActiveState.collectionTitle || ''
        let groupTitle = store.state.notes.catalogActiveState.tagGroupTitle || ''
        let tagTitle = store.state.notes.catalogActiveState.tagTitle || ''

        return `${collectionTitle}${groupTitle ? collectionTitle ? '/' + groupTitle : groupTitle : ''}${tagTitle ? groupTitle || collectionTitle ? '/' + tagTitle : tagTitle : ''}`
    })

    // 根据编辑框高度动态修改列表的高度;
    let finallyHeight = computed(() => { return store.state.notes.notesListHeight });

    // 当前笔记分类参数
    let isFinish = computed(() => { return store.state.notes.isFinish })
    let isTrash = computed(() => { return store.state.notes.notes.trash })
    let noteslist = computed(() => { return store.state.notes.noteslist })
    let noteCount = computed(() => { return store.state.notes.notesCount })

    // 刷新笔记列表
    let ifRefresh = ref(true);
    function refreshList(){
        ifRefresh.value = false;
        noteslistRef.value?.setScrollTop(0)
        getNotesList();
    }

    // 搜索笔记列表方法
    let keyword = ''
    let loadingList = ref(false)
    bus.on('INPUT_SEARCH', (e) => {
        keyword = e.keyword
        getNotesList();
    })
    bus.on("CLEAR_KAYWORD", () => {
        keyword = "";
        page = 1;
        store.commit("notes/RESET_NOTES_LIST")
        getNotesList();
    });
    bus.on("MAKE_LIST_TOP", () => {
        nextTick(() => {
            noteslistRef.value?.setScrollTop(0)
        })
    })

    // 筛选笔记方法
    let filterList = [
        {
            label: "创建时间 ▲",
            value: "desc",
            icon: 'arrow-down-1-9'
        },{
            label: "创建时间 ▼",
            value: "asc",
            icon: 'arrow-down-9-1'
        },{
            label: "更新时间 ▲",
            value: "desc",
            icon: 'arrow-down-1-9'
        },{
            label: "更新时间 ▼",
            value: "asc",
            icon: 'arrow-down-9-1'
        }
    ]
    let filterTypeList = [
        {
            label: '全部笔记',
            value: -1,
            icon: 'grip'
        },{
            label: '笔记卡片',
            value: 1,
            icon: 'lightbulb'
        },{
            label: '我的写作',
            value: 2,
            icon: 'file-lines'
        }
    ]
    let sortDefault = reactive({
        label: '按更新时间从新到旧',
        icon: 'arrow-down-1-9'
    })
    let typeDefault = reactive({
        label: '全部笔记',
        icon: 'grip'
    })
    filterTypeList.forEach(item => {
        if(store.state.notes.notes.note_type === item.value){
            typeDefault.label = item.label
            typeDefault.icon = item.icon
        }
    })
    filterList.forEach(item => {
        if(store.state.notes.notes.sort === item.value){
            sortDefault.label = item.label
            sortDefault.icon = item.icon
        }
    })
    function changeFilter(e){
        store.commit("notes/FILTER_NOTES_LIST",{
            sort: e.value
        })
        sortDefault.label = e.label
        sortDefault.icon = e.icon
        getNotesList()
    }
    // function changeTypeFilter(e){
    //     store.commit('notes/FILTER_NOTES_TYPE', { type: e.value })
    //     typeDefault.label = e.label
    //     typeDefault.icon = e.icon
    //     getNotesList()
    // }

    // 编辑该笔记
    const notesEditorChild = ref(null);
    function closeEdit(item){
        item.ifEditCon = false;
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
    let isLoading = ref(false)
    function getNotesList(page){
        isLoading.value = true
        store.dispatch("notes/getShortNotesList",{
            page: page ? page : 1,
            keyword: keyword || undefined,
        }).then((res) => {
            isLoading.value = false
            ifRefresh.value = true
            loadingList.value = false
        })
        store.dispatch('notes/getWriteNotesList',{
            page: page ? page : 1,
            keyword: keyword || undefined,
        }).then((res) => {
            bus.emit('readWriteNoteData')
        })
    }

    // 监听列表滚动
    let page = 1
    function loadPage(){
        if(isFinish.value){
            page ++
            getNotesList(page)
        }
    }

    // 监听删除note
    function deleteNote(){
        if(isFinish.value && noteslist.value.length < 10){
            page ++;
            getNotesList(page)
        }
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
</script>

<style lang="scss">
    .content-html{
        font-size: 14px;
        color: #323334;
        white-space: pre-wrap;
        line-height: 30px;
        .hashtag-suggestion {
            display: inline-block;
            color: $purple;
            border-radius: 2px;
            padding: 0 2px;
            margin: 0 1px;
            font-size: 14px;
            background: rgba($purple, 0.1);
            white-space: normal;
            line-height: 20px;
            cursor: pointer;
            transition: all 300ms;
            &:hover{
                color: #fff;
                background: rgba($purple, 0.8);
            }
        }
        img{
            max-width: 100%;
        }
        p{
            min-height: 22px;
        }
        ol, ul{
            margin: 0;
            padding-left: 20px;
        }
    }


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
        margin-top: 10px;
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
        }
    }
    .container{
        position: relative;
        padding: 2px 5px;
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