import { computed, ref } from "vue"
import store from "@/store/index.js"
import { closeTips } from "@/components/tipsButton"
import dependence from './dependence'
import { Editor } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import { generateJSON } from '@tiptap/html'
import smartRules from "./smartRules"
import suggestion from './suggestion'
// 用于图片粘贴上传
import {createImageExtension, handleTargetName} from "./pasteImage.js"

let timer = null
let cachedHtml = computed(() => store.state.notes.cachedNote )

// 简记模式
export const showOptions = ref(false)
export function editorInstance(content, editorBox, isEdit = false, className, onSubmit = ()=>{}, editContent = ()=>{}){
    const editor = new Editor({
        content: content || cachedHtml.value,
        autofocus: false,
        parseOptions: {
            preserveWhitespace: 'full',
        },
        NodeType:{
            whitespace: 'pre'
        },
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
            dependence.Placeholder.configure({
                placeholder: '💡在这里写下你的灵感和思考'
            }),
            new smartRules(),
            new createImageExtension(),
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
            const data = handleTagHtml(editor, isEdit)
            editor.commands.setContent(data)
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
            showOptions.value = true
            handleTargetName(isEdit ? `.${className.value}` : ".container-editor")
        },
        onBlur(){
            showOptions.value = false
        },
        beforeDestroy() {
            editor.destroy()
        },
    });

    return editor;
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
    const data = handleTagHtml(editor, true)
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

function handleTagHtml(editor, isEdit){
    const json = editor.getJSON()
    const html = editor.getHTML()
    if(html.indexOf(`data-type="mention"`) !== -1){
        loopData(isEdit, json.content)
    }
    return json
}
function loopData(isEdit, data){
    if(data && data.length){
        data.forEach((item,index) => {
            if(item.content && item.content.length){
                loopData(isEdit, item.content)
            }else{
                if(tagsInCenter(item, data, index)){
                    item.type = 'text'
                    item.text = `${item.attrs.id || '#'}`
                    delete item.attrs
                }else if(tagsInFirst(item, data, index)){
                    item.type = 'text'
                    item.text = `#${item.attrs.id}`
                    delete item.attrs
                }else if(tagsInLast(item, data, index)){
                    item.type = 'text'
                    item.text = `${item.attrs.id || '#'} `
                    delete item.attrs
                }else if(onlyTag(item, data, index)){
                    item.type = 'text'
                    item.text = isEdit ? `#${item.attrs.id} ` : `#${item.attrs.id}`
                    delete item.attrs
                }
            }
        })
    }
    return data
}

function tagsInCenter(item, data, index){
    return item.type === 'mention'
        && (data[index - 1]?.type === 'text'
            && data[index - 1]?.text === '/'
            && data[index + 1]?.type === 'text'
            && data[index + 1]?.text === '/')
}
function tagsInLast(item, data, index){
    return item.type === 'mention'
        && (data[index - 1]
            && data[index - 1].type === 'text'
            && data[index - 1].text === '/'
            && (!data[index + 1]
                || data[index + 1].text !== '/'))
}
function tagsInFirst(item, data, index){
    return item.type === 'mention'
        && (data[index + 1]?.type === 'text'
            && data[index + 1]?.text === '/')
}
function onlyTag(item, data, index){
    return item.type === 'mention'
        &&  ((!data[index - 1]
            || data[index - 1].text !== '/')
            && (!data[index + 1]
                || data[index + 1].text !== '/'))
}



