<template>
    <div class="write-container">
        <div class="write-menu unselectable">
            <div class="f-flex pt10 pb4">
                <el-button color="#6C56F6" round :icon="Plus" @click="addNote">新增写作</el-button>
            </div>
            <div class="write-menu-list" v-for="(note,index) in writeNotesList" :key="note.id" @click="readNoteDetail(note, index)">
                <div v-if="note.desc" class="desc line-2">
                    <svgFont class="note-icon" icon="note" color="#6F7A94"></svgFont>
                    {{note.desc}}
                </div>
                <div v-else class="desc no-desc">
                    <svgFont class="note-icon" icon="note" color="#6F7A94"></svgFont>
                    暂无内容 ~ ~
                </div>
            </div>
        </div>
        <div class="write-content">
            <div class="note-toolbar">
                <div class="write-info">
                    <span class="update-time">{{writeInfo.update_time}}</span>
                </div>
                <div class="toolbar-options">
                    <span class="size_count">{{writeInfo.size_count}}字</span>
                    <svgFont class="font width16" icon="cangku" @click="isShowShortNote = !isShowShortNote; isShowTableOfContents = false"></svgFont>
                    <svgFont class="font" icon="dagang" @click="isShowTableOfContents = !isShowTableOfContents; isShowShortNote = false"></svgFont>
                    <!--<font-awesome-icon class="font" @click="isShowShortNote = !isShowShortNote; isShowTableOfContents = false" icon="box-open"></font-awesome-icon>-->
                    <!--<font-awesome-icon class="font" @click="isShowTableOfContents = !isShowTableOfContents; isShowShortNote = false" icon="chart-bar"></font-awesome-icon>-->
                </div>
            </div>
            <div class="write-con note-style">
                <div class="show-tag" v-show="writeTags.length">
                    <span class="hashtag-suggestion" v-for="tag in writeTags" :key="tag.id" :data-id="tag.tag">#{{tag.tag}}</span>
                </div>
                <editor-content
                        class="body"
                        :editor="editor"
                        @click="getNoteNodeClick"
                        @dragenter="handledragenter()"
                        @drop="handleDrop"
                />
            </div>
        </div>


        <transition name="note-show">
            <div class="short-note-contains note-style" v-show="isShowShortNote">
                <p class="title">笔记库</p>
                <div class="pl10 pr10 pt10">
                    <el-input
                            v-model="searchKeyword"
                            class="w-50 m-2"
                            placeholder="搜索笔记..."
                            @change="searchNote"
                            :prefix-icon="Search"
                    />
                </div>
                <div class="filter f-flex pl10 pr10 pt10 pb10">
                    <el-select
                            class="mr10"
                            v-model="collectionActive"
                            placeholder="筛选笔记本"
                            clearable
                            filterable
                            @change="changeCollection"
                    >
                        <el-option
                                v-for="item in collectionList"
                                :key="item.id"
                                :label="item.collection"
                                :value="item.id"
                        />
                    </el-select>
                    <el-cascader
                            ref="tagSelectRef"
                            v-model="tagActive"
                            :options="tagsOptions"
                            :props="tagProps"
                            popper-class="tag-select-class"
                            clearable
                            filterable
                            placeholder="筛选标签"
                            @change="changeTags"
                    />
                </div>
                <div
                        class="note-list"
                        v-infinite-scroll="loadNextNotes"
                        :infinite-scroll-immediate="false"
                        :infinite-scroll-distance="50"
                >
                    <div
                            class="note-item"
                            v-for="item in notesList" :key="item.id"
                    >
                        <div class="note-header">
                            <div class="time">{{item.updated_at}}</div>
                            <div class="collection">{{item.collection?.collection}}</div>
                        </div>
                        <!--                            <div draggable="true" @dragstart="handleDragstart($event, item.note)">-->
                        <!--                                <div data-type="draggable-item">-->
                        <!--                                    <div v-html='item.note'></div>-->
                        <!--                                </div>-->
                        <!--                            </div>-->
                        <a href="javascript:void(0);" draggable="true" @dragstart="handleDragstart($event, item)">
                            <blockquote contenteditable="false">
                                <div v-html='item.note'></div>
                            </blockquote>
                        </a>
                    </div>
                    <el-divider>
                        <span v-if="pagingStatus.isFinish" class="color-9 font-12">暂无更多</span>
                        <template v-else>
                            <el-icon v-if="pagingStatus.isLoading" class="is_loading"><loading/></el-icon>
                            <span v-else class="color-9 font-12">加载更多 ~ </span>
                        </template>
                    </el-divider>
                </div>
            </div>
        </transition>
        <transition name="note-show">
            <div class="short-note-contains outline-contains" v-show="isShowTableOfContents">
                <p class="title">大纲</p>
                <ul class="outline-list">
                    <li
                            :class="[anchorActive === item.id ? 'outlineActive' : '']"
                            :style="{paddingLeft: `${(item.level - 1) * 10}px` }"
                            v-for="item in headingList" :key="item.id"
                            @click="scrollIntoView(item)"
                    >
                        {{ item.text }}
                    </li>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script setup>
    import { onMounted, ref, computed, reactive, defineEmits, nextTick } from 'vue'
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    import { deepClone } from '@/utils/tools'
    // 组件
    import { EditorContent } from '@tiptap/vue-3'
    import { Loading, Search, Plus } from '@element-plus/icons-vue'
    // hooks
    import { getNotesApi } from '@/apiDesktop/notes'
    import { getTagListApi, getGroupListApi } from '@/apiDesktop/tag'
    import { writeEditor, getEditorStatus, getTableOfContents, writeInfo, quoteArray, writeTags } from './js/writeEditor'
    import { getNoteNodeClick } from './js/editorMethods'

    const { app, ipcRenderer, shell } = require('electron')
    const { dialog } = require('electron').remote
    const fs = require('fs')

    const store = useStore()
    const emit = defineEmits(['handleWriteInfo'])

    let isShowShortNote = ref(false)
    let editor = ref(null)
    let isShowTableOfContents = ref(false)
    let headingList = ref(null)
    let writeNotesList = computed(() => store.state.notes.writeNotesList)

    // 读取笔记
    function readNoteDetail(item, index){
        getEditorStatus(item, index)
        writeTags.value = item.tags
        editor.value.commands.setContent(item.note)
        writeInfo.size_count = editor.value.storage.characterCount.characters()
        writeInfo.update_time = item.updated_time
        writeInfo.create_time = item.created_at
        let quoteArr = item.quote.map(item => item.id)
        for(let i = 0; i < quoteArr.length; i ++){
            quoteArray.push(quoteArr[i])
        }

        getTableOfContents(editor.value).then((res)=>{
            headingList.value = res
        })
    }
    // 新增笔记
    async function addNote(){
        let params = {
            contentJson: {"type":"doc","content":[{"type":"paragraph"}]} ,
            contentHtml: '<p></p>',
            note_type: 2
        }
        const res = await store.dispatch("notes/addNotes", params)
        bus.emit("READ_ARTICLE", { item: res.data, index: 0})
    }

    // 监听点击的长笔记
    // bus.on('READ_ARTICLE', ({item, index}) => {
    //     getEditorStatus(item, index)
    //     writeTags.value = item.tags
    //     editor.value.commands.setContent(item.note)
    //     writeInfo.size_count = editor.value.storage.characterCount.characters()
    //     writeInfo.update_time = item.updated_time
    //     writeInfo.create_time = item.created_at
    //     let quoteArr = item.quote.map(item => item.id)
    //     for(let i = 0; i < quoteArr.length; i ++){
    //         quoteArray.push(quoteArr[i])
    //     }
    //
    //     getTableOfContents(editor.value).then((res)=>{
    //         headingList.value = res
    //     })
    // })


    // 笔记拖拽后的引用关系
    let quoteItem = null
    const handleDragstart = (e, item) => {
        quoteItem = item
    }
    const handleDrop = () => {
        if(quoteArray.find(item => item.id !== quoteItem.id)){
            quoteArray.push(quoteItem.id)
        }
        quoteItem = null
    }

    onMounted(() => {
        editor.value = writeEditor()
        editor.value.on('update', () => {
            getTableOfContents(editor.value).then((res)=>{
                headingList.value = res
            })
        })
    })

    let html = null
    let isShortNoteDrog = false
    const handledragenter = () => {
        // console.log("handledragenter")
    }
    const handleDrops = (e) => {
        console.log("2131231231231萨达所大")


        return false
        console.log(editor.value)
        // e.preventDefault();
        // console.log(isShortNoteDrog)

        let pos = editor.value.posAtCoords({left: e.clientX, top: e.clientY})
        console.log("pos", pos)


        if(!isShortNoteDrog) return false

        // const html = e.dataTransfer.getData('text')
        // console.log(cursorPosition.value)
        // editor.value.commands.insertContentAt(cursorPosition.value, html, {
        //     updateSelection: true
        // })
        isShortNoteDrog = false
    }
    const handleDragstarts = (e, note) => {
        // console.log(e.target)
        isShortNoteDrog = true
        // console.log(isShortNoteDrog)
        html = `<div data-type="draggable-item">${note}<div>`
        e.dataTransfer.dropEffect = 'copy'
        e.dataTransfer.effectAllowed = 'all'
        e.dataTransfer.setData('text/html', html)
        // console.log('handleDragstart')
    }

    // 锚点定位
    let anchorActive = ref('')
    function scrollIntoView(item){
        anchorActive.value = item.id
        const element = document.getElementById(item.id)
        element.scrollIntoView({behavior: "smooth", block: "start"})
    }



    // let handleFile = ref(null)
    // const folderPath = localStorage.getItem('folderPath')
    // function createFolder(){
    //     dialog.showOpenDialog( {
    //         properties: [
    //             'openDirectory',
    //             'multiSelections',
    //             'createDirectory',
    //             'promptToCreate'
    //         ],
    //     }).then(result => {
    //         const path = result.filePaths[0]
    //         localStorage.setItem('folderPath', `${path}`)
    //     }).catch(err => {
    //         console.log(err)
    //     })
    // }
    // if(!folderPath || folderPath === 'undefined'){
    //     createFolder()
    // }



    // 笔记库相关逻辑
    const tagSelectRef = ref(null)
    const collectionActive = ref('')
    const tagActive = ref('')
    const notesList = ref([])
    let searchKeyword = ref('')
    let tagsList = ref([])
    let tagGroupList = ref([])
    let pagingStatus = reactive({
        isFinish: false,
        isLoading: false
    })
    const tagProps = {
        label: 'tag',
        value: 'id',
        children: 'list'
    }
    let isDown = false
    let noteParams = {
        user_id: store.state.user.userInfo.id,
        params: {
            collection_id: '',
            tag_id: '',
            group_id: '',
            keyword: '',
            today: 0,
            sort: 'desc',
            note_type: 1
        },
        trash: 0,
        page: 1,
        size: 30
    }
    let tagParams = {
        user_id: store.state.user.userInfo.id
    }

    const collectionList = computed(() => [...store.state.collection.projectListSelf, ...store.state.collection.projectListTeam])
    const tagsOptions = computed(() => {
        let list = []
        let topObj = {
            tag: "置顶标签",
            disabled: true
        }
        let topTagList = tagsList.value.filter(tag => tag.is_top === 1)
        if(topTagList.length) list.push(topObj)
        list = [...list, ...topTagList]

        let noTopObj = {
            tag: '普通标签',
            disabled: true
        }
        let noTopTagList = tagsList.value.filter(tag => tag.is_top === 0)
        if(noTopTagList.length) list.push(noTopObj)
        list = [...list, ...noTopTagList]

        let groupObj = {
            tag: '标签组',
            disabled: true
        }
        let groupList = tagGroupList.value.map(tag => {
            tag.tag = tag.name
            tag.id = tag.group_id
            return tag
        })
        if(groupList.length) list.push(groupObj)
        list = [...list, ...groupList]

        return list
    })

    onMounted(() => {
        getNoteList()
        getTagList()
    })

    function changeCollection(e){
        noteParams.params.collection_id = e
        tagParams.collection_id = e
        noteParams.page = 1
        notesList.value = []
        getNoteList()
        getTagList()
    }
    function changeTags(){
        const checkedNodes = tagSelectRef.value.getCheckedNodes()
        if(checkedNodes.length){
            const pathValues = checkedNodes[0].pathValues
            if(pathValues.length > 1){
                noteParams.params.group_id = pathValues[0]
                noteParams.params.tag_id = pathValues[1]
            }else{
                noteParams.params.group_id = ''
                noteParams.params.tag_id = pathValues[0]
            }
        }else{
            noteParams.params.group_id = ''
            noteParams.params.tag_id = ''
        }

        notesList.value = []
        noteParams.page = 1
        getNoteList()
    }

    function searchNote(){
        notesList.value = []
        noteParams.params.keyword = searchKeyword.value
        noteParams.page = 1
        getNoteList()
    }

    async function getNoteList(){
        pagingStatus.isLoading = true
        const res = await getNotesApi(deepClone(noteParams))
        if(res.status_code === 200){
            if(res.data.note) notesList.value = [...notesList.value, ...res.data.note]
            isDown = !res.data.note || res.data.note.length < noteParams.size
            pagingStatus.isFinish = !res.data.note || res.data.note.length < noteParams.size
        }
        pagingStatus.isLoading = false
    }
    async function getTagList(){
        const params1 = deepClone(tagParams)
        const res = await getTagListApi(params1)
        const params2 = deepClone(tagParams)
        const resGroup = await getGroupListApi(params2)
        if(res.status_code === 200){
            tagsList.value = res.data
        }
        if(resGroup.status_code === 200){
            tagGroupList.value = resGroup.data.filter(item => item.group_id)
        }
    }
    function loadNextNotes(){
        if(isDown) return false
        noteParams.page ++
        getNoteList()
    }



</script>

<style lang="scss" scoped>
    .write-container{
        display: flex;
        justify-content: space-between;
        .write-menu{
            width: 25%;
            max-width: 260px;
            height: calc(100vh - 54px);
            border-right: 1px solid #DEDEDE;
            overflow: scroll;
            .write-menu-list{
                padding: 10px 20px;
                margin: 6px 10px;
                background: #f6f8fc;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                &:hover{
                    background: #dcdcf9;
                }
                .desc{
                    width: 100%;
                    font-size: 14px;
                    color: #333333;
                }
                .no-desc{
                    color: #999999;
                }
                .note-icon{
                    margin-right: 2px;
                    vertical-align: text-top;
                }
            }
        }
        .note-toolbar{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 42px;
            padding: 0 10px;
            border-bottom: 1px solid #DEDEDE;
            .write-info{
                .update-time{
                    font-size: 14px;
                    color: #7B849B;
                }
            }
            .toolbar-options{
                display: flex;
                z-index: 999;
                .size_count{
                    font-size: 14px;
                    background: #eeeeee;
                    line-height: 24px;
                    border-radius: 24px;
                    padding: 0 10px;
                    color: #7B849B;
                }
                .font{
                    width: 20px;
                    height: 20px;
                    color: $purple;
                    border-radius: 4px;
                    padding: 2px;
                    margin-left: 10px;
                    cursor: pointer;
                    &:hover{
                        background: #eeeeee;
                    }
                }
                .width16{
                    width: 16px;
                    padding: 2px 4px;
                }
            }
        }
        .write-content{
            width: 75%;
            min-width: calc(100% - 260px);
        }
        .show-tag{
            padding: 0 0 10px;
            .hashtag-suggestion {
                cursor: pointer;
                color: $purple;
                border-radius: 2px;
                padding: 0 2px;
                font-size: 12px;
                margin-right: 8px;
                background: rgba($purple, 0.1);
                white-space: normal;
                display: inline-block;
                line-height: 20px;
                &:hover{
                    color: #fff;
                    background: $purple;
                }
            }
        }
        .write-con{
            height: calc(100vh - 100px);
            padding: 20px 20px 0;
            font-size: 16px;
            flex-shrink: 0;
            overflow: scroll;
            scrollbar-color: transparent transparent;
            &::-webkit-scrollbar {
                display: none;
            }
            .body{
                height: 100%;
            }
        }

        .short-note-contains{
            position: absolute;
            top: 0;
            right: 40px;
            width: 280px;
            height: calc(100vh - 30px);
            background: #fafafc;
            z-index: 99;
            overflow: hidden;
            box-shadow: -4px 4px 10px 0px rgba(0, 0, 0, .1);
            .title{
                text-align: center;
                padding: 10px 0 0;
                font-size: 16px;
                color: #999999;
                font-weight: bold;
            }
            .filter{
                border-bottom: 1px solid #eeeeee;
            }
            .note-list{
                height: calc(100vh - 130px);
                overflow: scroll;
                scrollbar-color: transparent transparent;
                &::-webkit-scrollbar {
                    display: none;
                }
                .note-header{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 10px 0 10px;
                    .time, .collection{
                        color: #999999;
                        font-size: 12px;
                    }
                    .collection{
                        width: 110px;
                        overflow: hidden;
                        text-align: right;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                }
                .note-item{
                    margin: 10px;
                    border-radius: 4px;
                    background: #f2f2f2;
                    transition: all .3s;
                    a{
                        padding: 10px;
                        display: block;
                        color: #333333;
                        font-size: 14px;
                        text-decoration: none;
                        word-break: break-all;
                        blockquote{
                            margin: 0;
                        }
                    }
                    &:hover{
                        box-shadow: 2px 2px 10px -4px rgba(0,0,0, .5);
                    }
                }
            }
        }
        .outline-contains{
            width: 200px;
            .outline-list{
                height: calc(100vh - 82px);
                margin: 0 0 10px 0;
                padding: 0 20px;
                list-style: none;
                overflow: scroll;
                scrollbar-color: transparent transparent;
                &::-webkit-scrollbar {
                    display: none;
                }
                li{
                    cursor: pointer;
                    font-size: 12px;
                    padding: 8px 0;
                    color: #696969;
                    &:hover{
                        color: $purple;
                        background: #f5f5f5;
                    }
                }
                .outlineActive{
                    color: $purple;
                }
            }
        }
    }

    .note-show-enter-active, .note-show-leave-active  {
        transition: all .5s ease;
    }
    .note-show-enter-from, .note-show-leave-to {
        transform: translateX(300px);
    }

</style>
<style lang="scss">
    .tag-select-class{
        max-width: 180px;
    }
    .height-light-tag{
        background: #7885d1;
    }

    .write-content{
        .ProseMirror{
            min-height: 14px;
            overflow-y: scroll;
            scrollbar-color: transparent transparent;
            max-height: none;
            color: #37352f;
            height: 100%;

            p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                color: #adb5bd;
                pointer-events: none;
                height: 0;
                font-size: 14px;
            }
            code {
                font-size: 14px;
                padding: 4px 4px;
                border-radius: 4px;
                background-color: #0D0D0D;
                color: #ffffff;
                box-decoration-break: clone;
            }
            pre {
                background: #0D0D0D;
                color: #FFF;
                font-family: 'JetBrainsMono', monospace;
                padding: 6px 10px;
                border-radius: 4px;
                code {
                    color: inherit;
                    padding: 0;
                    background: none;
                    font-size: 14px;
                }
            }
            blockquote {
                background: rgba($color: $purple2, $alpha: 0.05);
                margin: 4px 0px;
                padding: 8px 10px;
                border-left: 3px solid rgba($purple2, 0.1);
            }
        }
        .ProseMirror::-webkit-scrollbar {
            display: none;
            color: #a4a2ca;
        }
        .ProseMirror-focused{
            &:focus {
                outline: none;
            }
        }
        h1{
            margin: 20px 0;
        }
        h2, h3, h4, h5, h6{
            margin: 10px 0;
        }
        ul, ol{
            margin: 0;
            padding-left: 30px;
        }
        p{
            margin: 20px 0;
            font-size: 14px;
            line-height: 26px;
        }
        ul[data-type="taskList"] {
            list-style: none;
            padding: 0;
            li {
                display: flex;
                align-items: center;
                > label {
                    flex: 0 0 auto;
                    margin-right: 0.5rem;
                    user-select: none;
                }
                > div {
                    flex: 1 1 auto;
                }
            }
            input[type="checkbox"] {
                cursor: pointer;
            }
        }
    }
    .note-style{
        .hashtag-suggestion {
            color: $purple;
            background-color: rgba($purple, 0.1);
            border-radius: 2px;
            padding: 0px 2px;
            font-size: 14px;
            white-space: normal;
            display: inline-block;
            line-height: 20px;
        }
        img{
            max-width: calc(100% - 2px);
            &.ProseMirror-selectednode {
                margin: 1px;
                outline: 1px solid #68CEF8;
            }
        }
    }
    .dragContent{
        background: red;
    }
</style>