import { simpleEditor } from './cardEditor'
import { handleContentHtml } from '@/utils/processHtml'
import store from "@/store"
import request from "@/utils/mainRequest"

const tagService = require('service/service/tag')

class DropNoteFun {
    constructor(){
        this.instance = null
        this.timeouter = null
        this.lastenterEv = null
        this.sourceNote = null
        this.sourceIndex = null
        this.targetNote = null
        this.noteArray = []
    }

    // 开始移动
    handlerDragstart(item, index){
        console.log('213', item, index);
        this.sourceNote = item
        this.sourceIndex = index
    }

    // 放置拖拽
    async handleDrop(item, type){
        this.targetNote = item
        if(this.sourceNote.id === this.targetNote.id)  return false

        const user_id = store.state.user.userInfo.id
        item.showMarks = false
        if(type === 'merge'){
            const finishNote = this.targetNote.note + this.sourceNote.note
            const editor = simpleEditor(finishNote)

            const { tag_list } = handleContentHtml(editor.getHTML())
            const { list } = tagService.tagTool.json2Tree(editor.getJSON())
            const struct_list = tagService.tagTool.filterTreeKey(list)

            const data = {
                user_id,
                target_id: this.targetNote.id,
                source_id: this.sourceNote.id,
                tag_list,
                struct_list
            }
            request({
                api: 'compileNoteApi',
                key: 'compileNoteApi',
                data
            }, (res) => {
                if(res.status_code === 200){
                    store.commit('notes/RECOVERY_NOTE', res.data.note)
                    store.commit('notes/REMOVE_NOTE', {
                        index: this.sourceIndex,
                        note_type: 1
                    })
                }
            })

        }else if(type === 'quote'){
            let targetQuoteIds = this.targetNote.quote.map(q => q.id)
            let data = {
                user_id,
                target_id: this.targetNote.id,
                quote_list: [...targetQuoteIds, this.sourceNote.id]
            }
            request({
                api: 'quoteNoteApi',
                key: 'quoteNoteApi',
                data
            }, (res) => {
                if(res.status_code === 200){
                    store.commit('notes/RECOVERY_NOTE',res.data.note)
                }
            })
        }
    }

    handleDragover(ev, item){
        ev.preventDefault()
        if(!(this.sourceNote && this.sourceNote.id)) return false
        if(this.sourceNote.id === item.id) return false

        if(this.sourceNote.is_self === 2){
            item.showMarksLeft = true
        }

        if(!this.timeouter){
            this.timeouter = setTimeout(()=>{
                this.timeouter = null
                if(!item.id) return false
                this.noteArray.forEach(note => {
                    if(item.id !== note.id){
                        note.showMarks = false
                    }
                })
            }, 1000)
        }
    }

    handleDragenter(ev, item){
        ev.preventDefault()
        if(!(this.sourceNote && this.sourceNote.id)) return false

        this.lastenterEv = ev.target

        if(this.sourceNote.id === item.id) return false
        item.showMarks = true

        if( canAddArray(this.noteArray, item) ){
            this.noteArray.push(item)
        }
    }
    handleDragleave(ev, item){
        ev.preventDefault()
        if (this.lastenterEv === ev.target){
            item.showMarks = false
        }
    }
}

function canAddArray(noteArray, item){
    return !noteArray.length || !(noteArray.findIndex( e => e.id === item.id ) > -1)
}


const dropNoteFun = new DropNoteFun()
export default dropNoteFun
