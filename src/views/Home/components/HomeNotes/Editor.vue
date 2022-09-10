<template>
    <div>
        <div
                class="annotation-box"
                v-if="annotationNote.id"
        >
            <font-awesome-icon icon="quote-left" class="font-16 pt4" color="#9EA0AD" />
            <div class="note-cont" :class="[ !annotationNote.isFold ? 'annotation-max-height' : '' ]">
                <div class="content-html" v-html="annotationNote.note"></div>
            </div>
            <div class="anno-options">
                <div @click="controlIsFold">
                    <font-awesome-icon v-if="!annotationNote.isFold" icon="angle-down" color="#9EA0AD" class="margin-center font-16"/>
                    <font-awesome-icon v-else icon="angle-up" color="#9EA0AD" class="margin-center font-16" />
                </div>
                <div @click="closeAnnotation">
                    <font-awesome-icon icon="times-circle" class="font-14" color="#9EA0AD" />
                </div>
            </div>
        </div>
        <div class="container-editor" :class="className" ref="editorBox">
            <editor-content
                    class="editor-content-style"
                    :editor="editor"
                    @click="clickEditorNode"
                    @contextmenu="handleRightClick()"
                    @imageToWord="haveImageToWord"
            />
            <div class="tooler" v-if="editor">
                <div class="options">
                    <div class="trigger-style" @click="editor.chain().focus().insertContent('#').run()">
                        <font-awesome-icon icon="hashtag" class="font-14" color="#9EA0AD" />
                    </div>
                    <div class="trigger-style" @click="editor.chain().focus().toggleBold().run()">
                        <font-awesome-icon icon="bold" class="font-16" :color="editor.isActive('bold') ? '#333333' : '#9EA0AD'" />
                    </div>
                    <div class="trigger-style" @click="editor.chain().focus().toggleUnderline().run()">
                        <font-awesome-icon icon="underline" class="font-16" :color="editor.isActive('underline') ? '#333333' : '#9EA0AD'" />
                    </div>
                    <div class="trigger-style" @click="editor.chain().focus().toggleBulletList().run()">
                        <font-awesome-icon icon="list-ul" class="font-16" :color="editor.isActive('bulletList') ? '#333333' : '#9EA0AD'" />
                    </div>
                    <div class="trigger-style" @click="editor.chain().focus().toggleOrderedList().run()">
                        <font-awesome-icon icon="list-ol" class="font-16" :color="editor.isActive('orderedList') ? '#333333' : '#9EA0AD'" />
                    </div>
                    <div class="trigger-style">
                        <el-popover placement="bottom" :width="370" v-model:visible="showEmoji" trigger="click">
                            <VuemojiPicker @emojiClick="handleEmojiClick" :isDark="false" />
                            <template #reference>
                                <font-awesome-icon icon="face-laugh" class="font-16" color="#9EA0AD" />
                            </template>
                        </el-popover>
                    </div>
                    <div class="trigger-style" style="overflow: hidden;">
                        <el-upload
                                ref="elUploadRef"
                                class="upload-demo"
                                :action="api + '/api/user/upload'"
                                :show-file-list="false"
                                :on-progress="uploadLoading"
                                :on-success="uploadSuccess"
                                :headers="uploadHeader"
                        >
                            <font-awesome-icon icon="image" class="font-16 mt4" color="#9EA0AD" />
                        </el-upload>
                    </div>
                    <div style="width: 100px;" v-show="showProgress">
                        <el-progress color="#6C56F6" :stroke-width="10" :percentage="progressNum"></el-progress>
                    </div>
                </div>
                <el-button v-if="!edit" class="color-white btn-style" color="#734eff" type="primary" size="small" :loading="isDisabled" @click="onSubmit">记 录</el-button>
                <div v-else>
                    <el-button class="btn-style" plain color="#aaaaaa" size="small" @click="cancelEdit">取 消</el-button>
                    <el-button class="btn-style" color="#734eff" type="primary" size="small" :loading="isDisabled" @click="editContent">修 改</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { reactive, nextTick, ref, defineProps, defineEmits, computed, onBeforeUnmount } from "vue"
    import bus from '@/utils/bus'
    import { useStore } from "vuex"
    import { getToken } from "@/utils/auth"
    // 组件 ------
    import { ElMessage, ElNotification } from "element-plus"
    import { EditorContent } from '@tiptap/vue-3'
    import { VuemojiPicker } from 'vuemoji-picker'
    // hooks ----
    import { editorInstance } from "./js/cardEditor"
    import { imageToWordApi } from "@/api/notes"
    import { openUrlByBrowser } from "@/utils/tools"
    import { ipcRenderer } from "electron"

    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;

    const store = useStore();
    let api = process.env.VUE_APP_URL

    const props = defineProps({
        item: {
            type: Object,
            default: ""
        },
        content: {
            type: String,
            default: ''
        },
        index: {
            type: Number
        },
        edit: {
            type: Boolean,
            default: false
        },
        noteId: {
            type: String,
            default: ""
        },
        collectionId: {
            type: String,
            default: ""
        }
    })
    const emit = defineEmits(["editNotesContent"])

    // 获取当前editor的class名
    const className = computed(() => {
        let classname = ""
        if(props.item){
            classname += "editorJs-" + props.item.id
        }
        if(!props.edit){
            classname += ''
        }
        return classname
    })

    // 右键编辑框
    const handleRightClick = () => {
        let menu = new Menu()

        menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
        menu.append(new MenuItem({ label: '🖊️ 粘贴', role: 'paste' }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({ label: '🧽 清除样式', click: () => editor.value.commands.unsetAllMarks() }))
        menu.append(new MenuItem({ label: '🧹 清除节点', click: () => editor.value.commands.clearNodes() }))
        menu.append(new MenuItem({ label: '🗑️ 清空内容', click: () => {
                editor.value.commands.clearContent()
                store.commit('notes/CLEAR_CACHED_NOTE')
            }
        }))
        menu.popup()
    }

    let editorBox = ref(null)
    let editor = ref(null)
    editor.value = editorInstance(props.content, editorBox, props.edit, className, props, onSubmit, editContent)

    // 图片上传方法
    let uploadHeader = {
        hk: getToken()
    }
    const elUploadRef = ref(null)
    let progressNum = ref(0)
    let showProgress = ref(false)
    function uploadSuccess(response){
        showProgress.value = false
        if(response.code === 200){
            elUploadRef.value.clearFiles()
            if(response.data.file){
                handlePasteImage(response.data.file)
            }
        }
    }
    function uploadLoading(event){
        showProgress.value = true
        progressNum.value = parseInt(event.percent)
    }
    function handlePasteImage(src){
        const imageHtml = `<img src="${src}"><p></p>`
        editor.value.chain().insertContent( imageHtml ).focus().run()
    }
    bus.off('handlePasteImage')
    bus.on('handlePasteImage', ({type, src}) => {
        if(type !== 'card') return
        handlePasteImage(src)
    })

    // 提交输入内容
    let annotationNote = reactive({
        id: "",
        collection_id: "",
        note: "",
        quote: {},
        isFold: false,
        isOverHeight: 0
    });
    // 控制是否展开引用
    async function controlIsFold(){
        annotationNote.isFold = !annotationNote.isFold
        await nextTick()
        bus.emit("changeNotesListHeight")
    };
    // 关闭引用
    function closeAnnotation(){
        Object.keys(annotationNote).forEach((key) => {
            annotationNote[key] = ""
        })
        bus.emit("changeNotesListHeight")
    }
    // 监听展示引用模块
    bus.on("setAnnotationId", async ({item, isOverHeight}) => {
        Object.keys(annotationNote).forEach((key) => {
            annotationNote[key] = item[key]
        })
        annotationNote.isOverHeight = isOverHeight;
        await nextTick();
        bus.emit("changeNotesListHeight")
        editor.value.chain().focus();
    })

    // 提交笔记
    let isDisabled = ref(false);
    function onSubmit(){
        if(editor.value.isEmpty){
            ElNotification({
                message: '请输入要记录的内容',
                type: 'warning',
                duration: 1000
            })
            editor.value.commands.focus()
            return
        }

        let params = {
            json: editor.value.getJSON(),
            html: editor.value.getHTML(),
            annotation_id: annotationNote.id,
            note_type: 1
        }

        isDisabled.value = true
        store.dispatch("notes/addNotes", params).then((res) => {
            isDisabled.value = false
            if(res){
                Object.keys(annotationNote).forEach((key) => {
                    annotationNote[key] = ""
                })
                bus.emit("handleMakeListTop")
                store.commit("notes/CLEAR_CACHED_NOTE")
                editor.value.commands.clearContent()
                // 记录完后重新计算高度
                bus.emit("changeNotesListHeight", 100)
            }
        })
    }
    // 编辑笔记
    function editContent(){
        if(editor.value.isEmpty){
            ElNotification({
                message: '修改的内容不能为空~',
                type: 'warning',
                duration: 2000
            })
            editor.value.commands.focus()
            return false;
        }

        let params = {
            html: editor.value.getHTML(),
            json: editor.value.getJSON(),
            collection_id: props.collectionId,
            noteId: props.noteId,
            index: props.index,
            postil_list: props.item.quote.map(item => item.id)
        }

        isDisabled.value = true
        store.dispatch("notes/editNote", params).then((res) => {
            isDisabled.value = false
        })
    }
    function cancelEdit(){
        emit('editNotesContent', false)
    }

    // 监听选择标签
    bus.off('setTagToEditor')
    bus.on("setTagToEditor", (data) => {
        if(data.tag){
            let content = editor.value?.getHTML();  // 获取编辑器中的内容
            /**
             * 1.编辑器中没有标签 => 添加上标签
             * 2.编辑器中有标签但是没有内容 => 替换标签
             * 3.编辑器中有标签有内容 => 不处理
             */
            const reg = /\#(.+?)\s+?/
            if(!content.match(reg)){  // 说明有标签
                let jsonTag = {};
                if(editor.value.isEmpty){
                    jsonTag = {
                        content: [
                            {type: 'text', text: `#${data.tag} `},
                            {type: 'text', text: ' '}
                        ],
                        type: "paragraph"
                    }
                }else{
                    jsonTag = {
                        content: [
                            {type: 'text', text: `#${data.tag} `},
                            {type: 'text', text: ' '}
                        ],
                        type: "paragraph"
                    }
                }
                editor.value.chain().focus("end").insertContent(jsonTag).run();
            }
            if(content.match(reg) && content.split("</p>").length < 3){
                let jsonTag = {
                    content: [
                        {type: 'text', text: `#${data.tag} `},
                        {type: 'text', text: ' '}
                    ],
                    type: "paragraph"
                }
                editor.value.chain().focus("end").setContent(jsonTag).run();
            }
        }
    })

    // emoji 选择
    let showEmoji = ref(false);
    function handleEmojiClick(detail){
        editor.value.chain().focus().insertContent(detail.emoji.unicode).run();
        showEmoji.value = false;
    }

    // 点击编辑器
    function clickEditorNode(e){
        if(e.target.localName === 'a' && e.target.href){
            e.preventDefault()
            const url = e.target.href
            openUrlByBrowser(url)
            return false
        }
    }
    // ORC功能  图片识别文字   ----start-----
    function haveImageToWord(e){
        if(!e.src) {
            ElMessage.warning('图片识别错误，请重新选择图片~')
            return
        }
        imageToWordApi({
            path: e.src
        }).then((res) => {
            if(res?.code === 200){
                let html = ''
                const contentHtml = editor.value.getHTML()
                if(res.data.words && res.data.words.length) {
                    html = `${contentHtml}<p>${res.data.words.join(' ')}</p>`
                } else {
                    html = `${contentHtml}`
                }
                editor.value.chain().setContent(html).run()
            }
        })
    }

    // 监听快速保存的方法
    ipcRenderer.on('handleFastSaveNote', (event, params) => {
        params.isFast = true
        store.dispatch("notes/addNotes", params)
    })

    // 组件销毁前，取消bus监听
    onBeforeUnmount(() => {
        editor.value.destroy()
    })

    /**
     * 初始化编辑器
     * 1.由于有用户自定义快捷用语,所以需要在获取到数据后再加载编辑器,否则会出现快捷用语失效的bug
     */
    // let quickList = computed(() => { return store.state.user.userQuickList })
    // if(!(quickList.value && quickList.value.length > 0)){  // 判断有没有相关数据,没有数据重新调用接口
    //     store.dispatch("user/getUserQuickList").then((res) => {
    //         editor.value = editorInstance(props.content, editorBox, props.edit, className, onSubmit, editContent)
    //     })
    // }else{
    //     editor.value = editorInstance(props.content, editorBox, props.edit, className, onSubmit, editContent)
    // }
    // ---------- end -------------


    // onActivated(() => {
    //     editor.value?.destroy()
    //     if(!(quickList.value && quickList.value.length > 0)){  // 判断有没有相关数据,没有数据重新调用接口
    //         store.dispatch("user/getUserQuickList").then((res) => {
    //             editor.value = editorInstance(props.content, editorBox, props.edit, className, onSubmit)
    //         })
    //     }else{
    //         editor.value = editorInstance(props.content, editorBox, props.edit, className, onSubmit)
    //     }
    // })
</script>

<style lang="scss" scoped>
    .annotation-box{
        position: relative;
        display: flex;
        border: 1px solid #8f9ce2;
        padding: 6px;
        background: #f8f8fe;
        border-radius: 4px;
        .close{
            position: absolute;
            top: 0px;
            right: 0px;
            font-size: 16px;
            color: #fff;
            cursor: pointer;
            z-index: 99;
            background: #999;
            border-bottom-left-radius: 50%;
            &:hover{
                background: #666;
            }
        }
        .quote{
            color: $purple;
            font-size: 14px;
        }
        .note-cont{
            margin: 0 10px;
            width: calc(100% - 96px);
        }
        .annotation-max-height{
            max-height: 30px;
            overflow: hidden;
        }
        .anno-options{
            width: 56px;
            >div:first-child{
                padding: 3px 4px;
                margin-right: 4px;
            }
            >div{
                font-size: 12px;
                display: inline-block;
                font-weight: 700;
                cursor: pointer;
                background: #eee;
                padding: 2px 4px;
                border-radius: 4px;
                vertical-align: text-top;
                &:hover{
                    background: #e1e1e1;
                }
            }
        }

    }

    .orc-mask{
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(#000, 0.5);
    }

    .container-editor{
        position: relative;
        padding: 10px 14px;
        border-radius: 4px;
        font-size: 14px;
        background: #F6F8FC;
        transition: all .3s;
        &:hover{
            box-shadow: 0 4px 10px -8px rgba(0, 0, 0, .6);
        }
        .tooler{
            margin-top: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            .options{
                display: flex;
                align-items: center;
                > div{
                    border: none;
                    margin-right: 14px;
                    cursor: pointer;
                    padding: 3px 3px 0;
                    border-radius: 4px;
                }
                .checked-collection{
                    display: inline-block;
                    width: 60px;
                    height: 16px;
                    line-height: 16px;
                    color: #fff;
                    padding: 0 4px;
                    font-size: 12px;
                    border-radius: 2px;
                    background: #C9CCE0;
                }

                .collect{
                    cursor: pointer;
                    margin-right: 10px;
                    padding-top: 0;
                    .color{
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 6px;
                    }
                    .name{
                        display: inline-block;
                        max-width: 110px;
                        color: #999;
                        font-size: 12px;
                        &:hover{
                            color: $purple;
                        }
                    }
                }
            }
        }
    }
    .is-active{
        background: red;
        color: #fff;
    }
</style>
<style lang="scss">
    .el-upload-list{
        display: none;
    }
    .tooler{
        .el-button--medium{
            min-height: 0;
            padding: 0;
        }
        .options{
            .el-button{
                height: 0;
            }
        }
        .btn-style{
            width: 60px;
            height: 26px;
        }
        .collect{
            background: #fff;
            border: none;
            cursor: pointer;
            padding: 0px 3px;
            border-radius: 4px;
            .el-button{
                min-height: 0;
                padding: 0;
            }
        }
    }

    .orc-div{
        text-align: right;
        .orc-title{
            text-align: center;
            padding: 10px 0;
        }
    }
    .tips{
        position: fixed;
        .el-button--primary{
            background: rgba(#000, 0.7);
            color: #fff;
            border: rgba(#000, 0.7);
        }
    }
</style>
