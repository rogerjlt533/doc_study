<template>
    <div
            ref="annotationRef"
            class="annotation-box"
            v-if="annotationNote.id"
    >
        <font-awesome-icon icon="quote-left" style="font-size: 18px;" color="#9EA0AD" />
        <div class="note-cont" :class="[ !annotationNote.isFlod ? 'annotation-max-hieght' : '' ]">
            <div class="content-html" v-html="annotationNote.note"></div>
        </div>
        <div class="anno-options">
            <div class="flod-text"
                 @click="controlIsFlod"
            >{{!annotationNote.isFlod ? "展开" : "收起"}}</div>
            <div @click="closeAnnotation">
                <font-awesome-icon icon="times-circle" style="font-size: 14px;" color="#9EA0AD" />
            </div>
        </div>
    </div>
    <div class="container-editor" :class="className" ref="editorBox">
        <editor-content
                class="body"
                :editor="editor"
                @click="clickEditorNode"
                @contextmenu="handleRightClick()"
        />
        <div class="tooler" v-if="editor">
            <div class="options">
                <div class="trigger-style" @click="editor.chain().focus().insertContent('#').run()">
                    <font-awesome-icon icon="hashtag" class="font-16" color="#9EA0AD" />
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
                    <el-popover placement="right-start" :width="370" v-model:visible="showEmoji">
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
                            multiple
                            :show-file-list="false"
                            :on-progress="uploadLoading"
                            :on-success="uploadSuccess"
                            :headers="uploadHeader"
                    >
                        <font-awesome-icon icon="image" class="font-16 mt4" color="#9EA0AD" />
                    </el-upload>
                </div>
                <!--<el-dropdown v-if="!edit" size="small" trigger="click" max-height="238px">-->
                <!--    <div class="collect flex align-center">-->
                <!--        <font-awesome-icon icon="book" class="font-14" style="margin-top: -2px" color="#9EA0AD" />-->
                <!--        <span class="checked-collection line-1 ml4" v-show="collectionName">{{collectionName}}</span>-->
                <!--    </div>-->
                <!--    <template #dropdown>-->
                <!--        <el-dropdown-menu>-->
                <!--            <el-dropdown-item v-for="(item,index) in collectionListSelf" :key="index" @click="checkedCollection(item)">-->
                <!--                {{item.collection}}-->
                <!--            </el-dropdown-item>-->
                <!--            <el-divider v-if="collectionListSelf.length && collectionListTeam.length" style="margin: 4px 0"></el-divider>-->
                <!--            <el-dropdown-item v-for="(item,index) in collectionListTeam" :key="index" @click="checkedCollection(item)">-->
                <!--                {{item.collection}}-->
                <!--            </el-dropdown-item>-->
                <!--        </el-dropdown-menu>-->
                <!--    </template>-->
                <!--</el-dropdown>-->
                <!--<el-dropdown v-else size="small" trigger="click" max-height="238px">-->
                <!--    <div class="collect flex align-center" @click="showEditCollection = true">-->
                <!--        <span class="color" :style="{ background: item.collection.color }"></span>-->
                <!--        <span class="name line-1">{{ item.collection.collection }}</span>-->
                <!--    </div>-->
                <!--    <template #dropdown>-->
                <!--        <el-dropdown-menu>-->
                <!--            <el-dropdown-item v-for="(item,index) in collectionListSelf" :key="index" @click="resetCollection(item)">-->
                <!--                {{item.collection}}-->
                <!--            </el-dropdown-item>-->
                <!--            <el-divider v-if="collectionListSelf.length && collectionListTeam.length" style="margin: 4px 0"></el-divider>-->
                <!--            <el-dropdown-item v-for="(item,index) in collectionListTeam" :key="index" @click="resetCollection(item)">-->
                <!--                {{item.collection}}-->
                <!--            </el-dropdown-item>-->
                <!--        </el-dropdown-menu>-->
                <!--    </template>-->
                <!--</el-dropdown>-->
                <div style="width: 100px;" v-show="showProgress">
                    <el-progress :stroke-width="10" :percentage="progressNum"></el-progress>
                </div>
            </div>
            <el-button v-if="!edit" class="color-white btn-style" color="#734eff" type="primary" size="small" :loading="isDisabled" @click="onSubmit">记 录</el-button>
            <div v-else>
                <el-button class="color-white btn-style" type="info" color="#bbbbbb" size="small" @click="cencleEdit">取 消</el-button>
                <el-button class="color-white btn-style" color="#734eff" type="primary" size="small" :loading="isDisabled" @click="editContent">修 改</el-button>
            </div>
        </div>

        <!--<maskCom v-if="showEmoji" :opacity="0" :zIndex="99999" @click="showEmoji = false"></maskCom>-->
    </div>
</template>

<script setup>
    import {reactive, nextTick, ref, defineProps, defineEmits, onMounted, computed, onActivated} from "vue"
    import bus from '@/utils/bus'
    import { useStore } from "vuex"
    import { getToken } from "@/utils/auth"
    // 组件 ------
    import { ElNotification } from "element-plus"
    import { EditorContent } from '@tiptap/vue-3'
    import { VuemojiPicker } from 'vuemoji-picker'
    // import maskCom from '@/components/maskCom.vue'
    import { tipsBtn, closeTips } from "@/components/tipsButton"
    // hooks ----
    import { editorInstance, simpleEditor, showOptions} from "./js/editor.js";
    import { defaultCollection, defaultCollectionIndex } from "./js/repectFun.js";
    import { imageToWordApi } from "@/api/notes"
    import { handleContentHtml, handleHtmlTagSpace } from '@/assets/js/processHtml'
    import openUrlByBrowser from "@/assets/js/openUrlByBrowser"
    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;

    const store = useStore();
    let api = process.env.VUE_APP_URL
    const matchReg = /\#(\S+?)?\s{1}/g

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
    const emit = defineEmits(["editNotesContent"]);
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
                editor.value.chain().insertContent([
                    {
                        content: [
                            {type: 'image',attrs: { src: response.data.file }}
                        ],
                        type: "paragraph"
                    }
                ]).run()
            }
        }
    }
    function uploadLoading(event){
        showProgress.value = true
        progressNum.value = parseInt(event.percent)
    }

    // 提交输入内容
    let annotationNote = reactive({
        id: "",
        collection_id: "",
        note: "",
        quote: {},
        isFlod: false,
        isOverHeight: 0
    });
    // 控制是否展开引用
    let annotationRef = ref(null)
    async function controlIsFlod(){
        annotationNote.isFlod = !annotationNote.isFlod
        await nextTick()
        store.commit('notes/SET_NOTES_LIST_HEIGHT', editorBox.value.offsetHeight + annotationRef.value.offsetHeight)
    };
    // 关闭引用
    function closeAnnotation(){
        Object.keys(annotationNote).forEach((key) => {
            annotationNote[key] = ""
        })
        store.commit("notes/SET_NOTES_LIST_HEIGHT", editorBox.value.offsetHeight)
    }
    // 监听展示引用模块
    bus.on("SET_ANNOTATION_ID", async ({item, isOverHeight}) => {
        Object.keys(annotationNote).forEach((key) => {
            annotationNote[key] = item[key]
        })
        annotationNote.isOverHeight = isOverHeight;
        await nextTick();
        store.commit('notes/SET_NOTES_LIST_HEIGHT', editorBox.value.offsetHeight + annotationRef.value.offsetHeight);
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
            return false
        }

        const contentJson = editor.value.getJSON()
        const editorHtml = handleHtmlTagSpace(editor.value.getHTML())
        const tag_list = editorHtml.match(matchReg) ? editorHtml.match(matchReg).map(item => item.substr(1).trim()) : []
        const contentHtml = handleContentHtml(editor.value.getHTML())

        let params = {
            contentJson,
            contentHtml,
            annotation_id: annotationNote.id,
            note_type: 1,
            tag_list
        }

        isDisabled.value = true
        store.dispatch("notes/addNotes", params).then((res) => {
            isDisabled.value = false
            if(res){
                Object.keys(annotationNote).forEach((key) => {
                    annotationNote[key] = ""
                })
                bus.emit("MAKE_LIST_TOP")
                store.dispatch("user/getUserBase")
                store.commit("notes/CLEAR_CACHED_NOTE")
                editor.value.commands.clearContent()
                // 记录完后重新计算高度
                store.commit("notes/SET_NOTES_LIST_HEIGHT", 100)
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

        const contentJson = editor.value.getJSON()
        const editorHtml = handleHtmlTagSpace(editor.value.getHTML())
        const tag_list = editorHtml.match(matchReg) ? editorHtml.match(matchReg).map(item => item.substr(1).trim()) : []
        const contentHtml = handleContentHtml(editor.value.getHTML())

        let params = {
            contentHtml,
            contentJson,
            collection_id: props.collectionId,
            noteId: props.noteId,
            index: props.index,
            tag_list,
            postil_list: props.item.quote.map(item => item.id)
        }

        isDisabled.value = true
        store.dispatch("notes/editNote", params).then((res) => {
            isDisabled.value = false
        })
    }
    function cencleEdit(){
        emit('editNotesContent', false);
    }

    // 监听选择标签
    bus.on("SET_TEXT_EDITOR_TAG", (data) => {
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

    // 获取所有Collection
    let showCollect = ref(false);
    let collectionListSelf = computed(() => {
        return store.state.collection.projectListSelf
    })
    let collectionListTeam = computed(() => {
        return store.state.collection.projectListTeam
    })

    // 获取用户信息设置
    let userSetting = computed(() => {
        return store.state.user.userSetting
    })
    let collection_id;

    let collectionName = computed(() => {
        let title = "";
        let index = "";
        if (store.state.notes.editorCollection.checked_collection) {
            title = store.state.notes.editorCollection.checked_collection;
        }else{
            // 初始化默认选中的笔记本
            title = defaultCollection(userSetting.value.default);
            index = defaultCollectionIndex(userSetting.value.default);
            store.commit("notes/RECORD_COLLECTION",{
                checked_collection: title,
                collection_id: userSetting.value.default
            });
        }
        return title
    });

    // 重置collection
    let showEditCollection = ref(false)
    function resetCollection(collection){
        showEditCollection.value = false
        if(collection.id === props.item.collection_id) return false

        const contentJson = editor.value.getJSON()
        const editorHtml = handleHtmlTagSpace(editor.value.getHTML())
        const tag_list = editorHtml.match(matchReg) ? editorHtml.match(matchReg).map(item => item.substr(1).trim()) : []
        const contentHtml = handleContentHtml(editor.value.getHTML())

        store.dispatch("notes/editNote",{
            contentHtml,
            contentJson,
            collection_id: collection.id,
            noteId: props.item.id,
            index: props.index,
            tag_list,
            postil_list: props.item.quote.map(item => item.id)
        }).then((res) => {
            props.item.collection.color = res.data.collection.color;
            props.item.collection.collection = res.data.collection.collection;
            props.item.collection_id = res.data.collection_id;
        })
    }

    // 选中项目进行关联
    function checkedCollection(item){
        showCollect.value = false;
        store.commit("notes/RECORD_COLLECTION",{
            checked_collection: item.collection,
            collection_id: item.id
        });
    }

    // 点击编辑框  ORC功能  图片识别文字   ----start-----
    let imageUrl = "";
    function clickEditorNode(e){
        closeTips()
        if(e.target.src){
            imageUrl = e.target.src;
            tipsBtn({
                show: true,
                url: e.target.src
            }).then(()=>{
                haveImageToWord();
            })
            return false
        }
        if(e.target.localName === 'a' && e.target.href){
            e.preventDefault()
            const url = e.target.href
            openUrlByBrowser(url)
            return false
        }
        closeTips()
    }
    function haveImageToWord(){
        imageToWordApi({
            path: imageUrl
        }).then((res) => {
            if(res.code == 200){
                let html = '';
                res.data.words.forEach(item => {
                    html += `<p>${item}</p>`
                })
                editor.value.chain().focus("end").insertContent(html).run();
            }
        })
    }
    //  ----end-----

    /**
     * 初始化编辑器
     * 1.由于有用户自定义快捷用语,所以需要在获取到数据后再加载编辑器,否则会出现快捷用语失效的bug
     */
    let editorBox = ref(null)
    let editor = ref(null)
    editor.value = editorInstance(props.content, editorBox, props.edit, className, onSubmit, editContent)
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

<style lang="scss">
    .body{
        .ProseMirror{
            min-height: 14px;
            max-height: calc(50vh);
            overflow-y: scroll;
            scrollbar-color: transparent transparent;
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
        .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
        }

        ul, ol{
            margin: 0;
            padding-left: 30px;
        }
        p{
            margin: 0;
            line-height: 30px;
        }

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
        }
        .annotation-max-hieght{
            max-height: 36px;
            overflow: hidden;
        }
        .content-html{
            color: #999;
        }
        .anno-options{
            width: 56px;
            >div{
                font-size: 12px;
                display: inline-block;
                font-weight: 700;
                cursor: pointer;
                background: #eee;
                padding: 2px 4px;
                border-radius: 4px;
                &:hover{
                    background: #e1e1e1;
                }
            }
            .close-text{
                color: $error;
                margin-bottom: 4px;
            }
            .flod-text{
                color: #3d8aff;
                margin-right: 2px;
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