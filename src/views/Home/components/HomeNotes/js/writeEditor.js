import { ref, reactive } from "vue"
import {Editor} from '@tiptap/vue-3'
import { Extension, Node, markInputRule, markPasteRule, mergeAttributes, inputRulesPlugin } from '@tiptap/core'
import dependence from './dependence'
import store from "@/store/index.js"
import smartRules from "./smartRules"
import suggestion from './suggestion'
import { createImageExtension, handleTargetName } from "./pasteImage.js" // 用于图片粘贴上传
import { generateJSON } from '@tiptap/html'
import { filterSpecialFont } from '@/utils/tools'

const tagTool = require('service/tool/tag')

let editor = null
let timer = null
let editTime = null
let isEdit = false
let noteItem = null
let noteIndex = 0
export let writeTags = ref([])
export let cursorPosition = ref(0)
export let quoteArray = []
export let writeInfo = reactive({
    created_at: '',
    updated_at: '',
    size_count: '',
    status: 'saved',  // saved:已保存  failed:失败的  loading:保存中
})


// 写作模式编辑器
export function writeEditor(){
    editor = new Editor({
        content: ``,
        autofocus: true,
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
            dependence.Highlight,
            dependence.TaskItem,
            dependence.TaskList,
            dependence.Strike,
            dependence.CharacterCount,
            dependence.DraggableItem,
            dependence.Placeholder.configure({
                placeholder: '🍵 在这里，梳理你的卡片笔记，写下你的思考。'
            }),
            dependence.Heading,
            dependence.Italic,
            dependence.HorizontalRule,
            dependence.Blockquote,
            dependence.CharacterCount,
            dependence.Code,
            dependence.CodeBlock,
            dependence.Color,
            dependence.HardBreak,
            dependence.Dropcursor.configure({
                color: '#cccccc',
                width: 2
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
            dependence.TableOfContents,
            dependence.Mention.configure({
                HTMLAttributes: {
                    class: 'hashtag-suggestion'
                },
                suggestion
            }),
            Extension.create({
                addKeyboardShortcuts() {
                    return {
                        'Cmd-s'() {
                            if (editTime) clearTimeout(editTime)
                            editTime = setTimeout(() => {
                                edit(editor)
                            }, 500)
                            return true
                        },
                        'Ctrl-s'() {
                            if (editTime) clearTimeout(editTime)
                            editTime = setTimeout(() => {
                                edit(editor)
                            }, 500)
                            return true
                        },
                    }
                },
            })
        ],
        onCreate({ editor }){
            const { state, view } = editor
            if (state.plugins.length > 0) {
                const restOfPlugins = []
                const suggestionPlugins = []
                state.plugins.forEach((plugin) => {
                    if (plugin.key.includes('mention$')) {
                        suggestionPlugins.push(plugin)
                    } else {
                        restOfPlugins.push(plugin)
                    }
                })
                view.updateState(
                    state.reconfigure({
                        plugins: [...suggestionPlugins, ...restOfPlugins],
                    })
                )
            }
        },
        onUpdate({ editor }) {
            if (timer) {
                clearTimeout(timer)
                timer = null
            }
            timer = setTimeout(() => {
                writeInfo.size_count = editor.storage.characterCount.characters()
                edit(editor)
            }, 1500)
        },
        onFocus(){
            handleTargetName(".write-content")
        },
        onBlur(){
            editNow()
        },
        beforeDestroy() {
            editor.destroy()
        },
    });

    return editor;
}

export const handlePasteImage = (src) => {
    const imageHtml = `<img src="${src}"><p></p>`
    editor.chain().insertContent( imageHtml ).focus().run()
}

export function getEditorStatus(item, index){
    noteItem = item
    noteIndex = index
    isEdit = true
}

export function edit(editor){
    writeInfo.status = 'loading'

    if(!noteItem?.collection_id) {
        addNotes(editor)
        return false
    }

    let contentJson = editor.getJSON()
    let contentHtml = editor.getHTML()

    let params = {
        contentHtml,
        contentJson,
        collection_id: noteItem.collection_id,
        noteId: noteItem.id,
        index: noteIndex,
        postil_list: quoteArray,
        tag_list: filterSpecialFont(tagTool.json2List(contentJson)),
        noteType: 2
    }

    store.dispatch("notes/editNote", params).then((res) => {
        if(res.status_code === 200){
            writeInfo.status = 'saved'
            writeInfo.updated_at = res.data.updated_time
            writeTags.value = res.data.tags
        }else{
            writeInfo.status = 'failed'
        }
    }).catch((err) => {
        writeInfo.status = 'failed'
    })
}

function editNow(){
    if( !timer ) return

    clearTimeout(timer)
    timer = null
    edit(editor)
}

function addNotes(editor){
    let contentJson = editor.getJSON()
    let contentHtml = editor.getHTML()

    let params = {
        contentJson,
        contentHtml,
        annotation_id: quoteArray,
        tag_list: filterSpecialFont(tagTool.json2List(contentJson)),
        note_type: 2
    }
    store.dispatch("notes/addNotes", params).then((res) => {
        console.log('res', res.status_code === 200)
        if(res.status_code === 200){
            writeInfo.status = 'saved'
            writeInfo.updated_at = res.data.updated_time
            getEditorStatus(res.data, 0)
        }else{
            writeInfo.status = 'failed'
        }
    })
}

export function getTableOfContents(editor){
    return new Promise(resolve => {
        const headings = []
        const transaction = editor.state.tr
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
                const id = `heading-${headings.length + 1}`

                if (node.attrs.id !== id) {
                    transaction.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        id,
                    })
                }

                headings.push({
                    level: node.attrs.level,
                    text: node.textContent,
                    id,
                })
            }
        })

        transaction.setMeta('addToHistory', false)
        transaction.setMeta('preventUpdate', true)

        editor.view.dispatch(transaction)

        resolve(headings)
    })
}

export function getHtmlToJson(html){
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
        dependence.Highlight,
        dependence.TaskItem,
        dependence.TaskList,
        dependence.Strike,
        dependence.CharacterCount,
        dependence.DraggableItem,
        dependence.Heading,
        dependence.Italic,
        dependence.HorizontalRule,
        dependence.Blockquote,
        dependence.CharacterCount,
        dependence.Code,
        dependence.CodeBlock,
        dependence.Color,
        dependence.HardBreak,
        dependence.Image,
        dependence.Link.configure({
            HTMLAttributes: {
                class: 'link-class',
            },
            openOnClick: true
        }),
        dependence.History,
        dependence.TableOfContents,
        dependence.Mention.configure({
            HTMLAttributes: {
                class: 'hashtag-suggestion'
            },
            suggestion
        })
    ])
}

