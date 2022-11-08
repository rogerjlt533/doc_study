import { computed, ref } from "vue"
import store from "@/store/index.js"
import { closeTips } from "@/components/tipsButton"
import dependence from '../../../../../components/tiptap-extensions/js/dependence'
import { Editor } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import { generateJSON } from '@tiptap/html'
import smartRules from "./smartRules"
import suggestion from '../../../../../components/tiptap-extensions/js/suggestion'
import { handleTagHtml } from '@/utils/tools'
// 用于图片粘贴上传
import {createImageExtension, handleTargetName} from "./pasteImage.js"
import Image from "@tiptap/extension-image";

let cardEditor = null
let timer = null
let cachedHtml = computed(() => store.state.notes.cachedNote )
// 简记模式
// export const showOptions = ref(false)
export function editorInstance(content, editorBox, isEdit = false, className, onSubmit = ()=>{}, editContent = ()=>{}){
    cardEditor = new Editor({
        content: content || cachedHtml.value,
        autofocus: false,
        parseOptions: {
            preserveWhitespace: 'full',
        },
        NodeType:{
            whitespace: 'pre'
        },
        extensions: [
            dependence.HardBreak,
            dependence.Document,
            dependence.Paragraph,
            dependence.Text,
            dependence.TextStyle,
            dependence.BulletList,
            dependence.OrderedList,
            dependence.ListItem,
            dependence.Underline,
            dependence.Bold,
            dependence.Placeholder.configure({
                placeholder: '💡在这里写下你的灵感和思考'
            }),
            new smartRules(),
            new createImageExtension(handlePasteImage),
            dependence.Link.configure({
                HTMLAttributes: {
                    class: 'link-class',
                },
                openOnClick: true
            }),
            dependence.History,
            Extension.create({
                addKeyboardShortcuts() {
                    return {
                        'Cmd-Enter'() {
                            isEdit ? editContent() : onSubmit()
                            return true
                        },
                        'Ctrl-Enter'() {
                            isEdit ? editContent() : onSubmit()
                            return true
                        },
                    }
                },
            }),
            dependence.Mention.configure({
                HTMLAttributes: {
                    class: 'hashtag-suggestion'
                },
                suggestion
            }),
        ],
        onCreate(){
            const json = cardEditor.getJSON()
            const html = cardEditor.getHTML()
            const data = handleTagHtml(json, html, isEdit)
            cardEditor.commands.setContent(data)
            if(isEdit) return false;
            store.commit("notes/SET_NOTES_LIST_HEIGHT", editorBox.value?.offsetHeight)
        },
        onUpdate({ editor }) {
            if(isEdit) return false
            // 获取页面的内容
            let htmlData = editor.getHTML()

            // 监听输入框的高度,动态调整列表页的高度
            // 兼容内容有图片上传时,图片加载较慢时会导致高度监听错误
            if(htmlData.indexOf("img") !== -1){
                setTimeout(() => {
                    store.commit("notes/SET_NOTES_LIST_HEIGHT", editorBox.value.offsetHeight)
                }, 500)
            }else{
                store.commit("notes/SET_NOTES_LIST_HEIGHT", editorBox.value.offsetHeight)
            }

            // 缓存输入的笔记到本地浏览器
            if(timer) clearTimeout(timer);
            timer = setTimeout(() => {
                store.commit("notes/CACHED_NOTE", htmlData);
            },1500)

            closeTips(); // 及时关闭识别文字的弹窗
        },
        onSelectionUpdate({editor}) {
            closeTips(); // 及时关闭识别文字的弹窗
        },
        onFocus(){
            // showOptions.value = true
            handleTargetName(isEdit ? `.${className.value}` : ".container-editor")
        },
        onBlur(){
            // showOptions.value = false
        },
        beforeDestroy() {
            cardEditor.destroy()
        },
    });

    return cardEditor;
}

const handlePasteImage = (src) => {
    const imageHtml = `<img src="${src}"><p></p>`
    cardEditor.chain().insertContent( imageHtml ).focus().run()
}

// 采用单例模式建立editor
Editor.simpleEditor = function (content){
    if(!this.instance){
        this.instance = new Editor({
            content: content,
            extensions: [
                dependence.Document,
                dependence.Paragraph,
                dependence.Text,
                dependence.TextStyle,
                dependence.BulletList,
                dependence.OrderedList,
                dependence.ListItem,
                dependence.Underline,
                dependence.Bold,
                new createImageExtension(),
                dependence.Link.configure({
                    openOnClick: true
                }),
                dependence.Mention.configure({
                    HTMLAttributes: {
                        class: 'hashtag-suggestion'
                    },
                    suggestion: {
                        char: "#"
                    },
                }),
            ]
        })
    }
    return this.instance
}
export function simpleEditor (content){
    const editor = Editor.simpleEditor(content)
    if(editor){
        editor.commands.setContent(content)
    }
    const json = editor.getJSON()
    const html = editor.getHTML()
    const data = handleTagHtml(json, html, true)
    editor.commands.setContent(data)

    return editor
}

export function handleHtmlToJson(html){
    return generateJSON(html, [
        dependence.Document,
        dependence.Paragraph,
        dependence.Text,
        dependence.TextStyle,
        dependence.BulletList,
        dependence.OrderedList,
        dependence.ListItem,
        dependence.Underline,
        dependence.Bold,
        dependence.Image,
        dependence.Link.configure({
            openOnClick: true
        }),
        dependence.Mention.configure({
            HTMLAttributes: {
                class: 'hashtag-suggestion'
            },
            suggestion: {
                char: "#"
            },
        }),
    ])
}



