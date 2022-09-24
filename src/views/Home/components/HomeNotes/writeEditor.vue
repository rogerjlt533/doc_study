<template>
    <div class="write-container">
        <div class="write-menu unselectable">
            <div class="f-flex pt10 pb4">
                <el-button color="#6C56F6" round :icon="Plus" @click="addNote">新增写作</el-button>
            </div>
            <div class="write-list-scroll scroll-style" v-if="writeNotesList.length">
                <div
                        class="write-menu-list"
                        :class="writeNoteActive === note.id && 'active'"
                        v-for="(note,index) in writeNotesList"
                        :key="note.id"
                        @click="readNoteDetail(note, index)"
                        @contextmenu="handleRightClick(note, index)"
                >
                    <div v-if="note.desc" class="desc line-2">
                        <svgFont class="note-icon" icon="note" color="#6F7A94"></svgFont>
                        {{note.desc}}
                    </div>
                    <div v-else class="desc no-desc">
                        <svgFont class="note-icon" icon="note" color="#6F7A94"></svgFont>
                        ♨ 还没开始写
                    </div>
                </div>
                <p class="text-center font-12 color-9 pt20">笔记总数：{{notesCount}}</p>
            </div>
            <div class="text-center font-12 color-9 pt20" v-else>
                <p>🎨 写作即思考本身，开启一段深度思考吧</p>
            </div>
        </div>
        <div class="write-content">
            <div class="note-toolbar">
                <div class="write-info">
                    <svgFont icon="markdown" class="color-9 mr6"></svgFont>
                    <span class="update-time mr10">{{writeInfo.updated_at}}</span>
                    <span v-if="writeInfo.status === 'saved'" class="color-9 font-12">已保存</span>
                    <span v-else-if="writeInfo.status === 'loading'" class="is-loading color-9 font-12">存储中 ...</span>
                    <span v-else-if="writeInfo.status === 'failed'" class="color-failed font-12">本地存储失败，请尝试另存</span>
                </div>
                <div class="toolbar-options">
                    <span class="size_count">{{writeInfo.size_count}}字</span>
                    <svgFont class="font width16" :class="[ isShowShortNote ? 'font-active' : '' ]" icon="cangku" @click="bindNoteLibrary"></svgFont>
                    <svgFont class="font" :class="[ isShowTableOfContents ? 'font-active' : '' ]" icon="dagang" @click="isShowTableOfContents = !isShowTableOfContents; isShowShortNote = false"></svgFont>
                </div>
            </div>
            <div class="write-con note-style">
                <div class="show-tag" v-show="writeTags?.length">
                    <span class="hashtag-suggestion" v-for="tag in writeTags" :key="tag.id" :data-id="tag.tag">#{{tag.tag}}</span>
                </div>
                <editor-content
                        class="body"
                        :editor="editor"
                        @click="getNoteNodeClick($event, 'write')"
                        @dblclick="dblclickNote"
                        @dragenter="handledragenter()"
                        @drop="handleDrop"
                />
            </div>
        </div>

        <transition name="note-show">
            <notesLibrary ref="notesLibraryRef" v-show="isShowShortNote"></notesLibrary>
        </transition>
        <transition name="note-show">
            <outline-component :outline="headingList" v-show="isShowTableOfContents"></outline-component>
        </transition>
    </div>
</template>

<script setup>
    import {onMounted, ref, computed, defineEmits, defineAsyncComponent} from 'vue'
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // hooks
    import {
        writeEditor,
        getEditorStatus,
        getTableOfContents,
        writeInfo,
        quoteArray,
        writeTags
    } from './js/writeEditor'
    import { getNoteNodeClick, dblclickNote } from './js/editorMethods'
    import { fixTipTapContent } from "./js/handleParseImageFormat"
    // 组件
    import { EditorContent } from '@tiptap/vue-3'
    import { Plus, SuccessFilled, WarningFilled, Loading } from '@element-plus/icons-vue'
    import fcDialog from '@/components/dialog'
    const outlineComponent = defineAsyncComponent(() => import('./components/outlineComponent.vue'))
    const notesLibrary = defineAsyncComponent(() => import('./components/notesLibrary.vue'))

    const remote = require('electron').remote
    const Menu = remote.Menu
    const MenuItem = remote.MenuItem

    const store = useStore()
    const emit = defineEmits(['deleteNote'])

    let isShowShortNote = ref(false)
    let editor = ref(null)
    let headingList = ref(null)
    let isShowTableOfContents = ref(false)
    let writeNotesList = computed(() => store.state.notes.writeNotesList)
    let writeNoteActive = computed(() => store.state.notes.writeNoteState.active)
    let notesCount = computed(() => store.state.notes.catalogActiveState.long_note_count )

    // bus 监听
    bus.on('readWriteNoteData', () => {
        initNoteData()
    })
    bus.on('handlePasteImage', ({type, src}) => {
        if(type !== 'write') return
        handlePasteImage(src)
    })

    // 初始化数据
    function initNoteData(){
        let initItem = writeNotesList.value[0]
        if(initItem) {
            readNoteDetail(initItem, 0)
            return
        }

        initItem = {
            note: "<p></p>",
            id: ''
        }
        readNoteDetail(initItem, 0)
    }
    // 读取笔记
    function readNoteDetail(item, index){
        getEditorStatus(item, index)
        setNoteState(item)
        writeTags.value = item.tags
        writeInfo.size_count = editor.value.storage.characterCount.characters()
        writeInfo.updated_at = item.updated_time
        writeInfo.created_at = item.created_at
        let quoteArr = item.quote ? item.quote.map(item => item.id) : []
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
            json: {"type":"doc","content":[{"type":"paragraph"}]} ,
            html: '<p></p>',
            note_type: 2
        }
        store.dispatch("notes/addNotes", params).then((res) => {
            let data = res.data
            writeInfo.updated_at = data.updated_time
            writeInfo.created_at = data.created_at

            getEditorStatus(data, 0)
            setNoteState(data)
        })
    }

    // 右击笔记
    let rightClickNote = null
    let rightClickNoteIndex = null
    const isTrash = computed(() => store.state.notes.catalogActiveState.trashActive)
    function handleRightClick(note, index){
        let menu = new Menu()
        rightClickNote = note
        rightClickNoteIndex = index

        if(isTrash.value){
            menu.append(new MenuItem({ label: '🗑 删除笔记', click: deleteNote }))
        }else{
            // menu.append(new MenuItem({ label: '📝 编辑', click: editNote }))
            // menu.append(new MenuItem({ label: '💬 引用', click: annotation }))
            // menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
            // menu.append(new MenuItem({ label: '📅 笔记历史', click: getNoteHistory }))
            // menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({ label: '🗑 扔到废纸篓', click: moveTrashCan }))
        }

        menu.popup()
    }

    // 废纸篓该笔记
    function moveTrashCan(){
        fcDialog({
            title: '提示',
            message: "确定将这条笔记扔到废纸篓吗?",
        }).then(() => {
            store.dispatch("notes/removeNote",{
                id: rightClickNote.id,
                note_type: rightClickNote.note_type,
                index: rightClickNoteIndex
            }).then((res) => {
                initNoteData()
            })
            store.dispatch("user/getUserBase");
        }).catch(()=>{})
    }
    // 删除该笔记
    function deleteNote(){
        fcDialog({
            title: '提示',
            message: "确定将这条笔记永久删除吗?",
        }).then(() => {
            store.dispatch("notes/deleteNote",{
                note_id: rightClickNote.id,
                index: rightClickNoteIndex,
                note_type: 2
            }).then((res) => {
                initNoteData()
            })
            store.dispatch("user/getUserBase")
        }).catch(()=>{})
    }

    // 设置笔记显示状态
    function setNoteState(item){
        item.note = fixTipTapContent(item.note)
        editor.value.commands.setContent(item.note)
        store.commit('notes/SET_WRITE_NOTE_STATE', {
            active: item.id
        })
    }

    // 点击笔记仓库
    const notesLibraryRef = ref(null)
    function bindNoteLibrary(){
        isShowShortNote.value = !isShowShortNote.value
        isShowTableOfContents.value = false
        if(!isShowShortNote.value) return
        notesLibraryRef.value.getNoteList()
        notesLibraryRef.value.getTagList()
    }

    // 粘贴上传图片
    function handlePasteImage(src){
        const imageHtml = `<img src="${src}"><p></p>`
        editor.value.chain().insertContent( imageHtml ).focus().run()
    }

    onMounted(() => {
        editor.value = writeEditor()
        editor.value.on('update', () => {
            getTableOfContents(editor.value).then((res)=>{
                headingList.value = res
            })
        })
    })

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

    let html = null
    let isShortNoteDrog = false
    const handledragenter = () => {
        // console.log("handledragenter")
    }
    const handleDrops = (e) => {
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
            .write-list-scroll{
                height: calc(100vh - 100px);
            }
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
        .active{
            background: #dcdcf9 !important;
        }
        .note-toolbar{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 42px;
            min-width: 400px;
            padding: 0 10px;
            border-bottom: 1px solid #DEDEDE;
            .write-info{
                display: flex;
                align-items: center;
                .update-time{
                    font-size: 12px;
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
                .font-active {
                    background: #eeeeee;
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
            height: calc(100vh - 120px);
            padding: 20px 40px 0;
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
    }

    .note-show-enter-active, .note-show-leave-active  {
        opacity: 1;
        transition: all .5s ease;
    }
    .note-show-enter-from, .note-show-leave-to {
        opacity: 0;
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
                background-color: #f7f6f3;
                color: #37352f;
                box-decoration-break: clone;
            }
            pre {
                background: #f7f6f3;
                color: #37352f;
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
                border-radius: 4px;
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
        li{
            p{
                margin: 6px 0;
            }
        }
        p{
            margin: 20px 0;
            font-size: 14px;
            line-height: 26px;
            letter-spacing: 0.5px;
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
        img {
            display: block;
            max-width: 100%;
            margin: 4px;
            border-radius: 4px;

            &.ProseMirror-selectednode {
                border: 4px solid rgb(108 86 246 / 30%);
            }
        }
    }
    .dragContent{
        background: red;
    }
</style>