<template>
<draggable
v-model="collectionList"
@start="startDrag"
@end="endDrag"
item-key="id"
animation="200"
ghostClass="collection-ghost"
chosenClass="collection-chosen"
handle=".handle"
    >
    <template #item="{element, index}">
    <div class="project"
:class="{ 'active-project' : collectionActive === element.id }"
@click="clickProject(element)"
@mouseenter="element.showOpt = true"
@mouseleave="element.showOpt = false"
    >
    <div class="project-title" @contextmenu="handleRightClick(element, index)">
    <div class="title line-1 unselectable">
    <span class="color" :style="{ background: element.color }"></span>
{{element.collection}}
</div>
<div class="options handle" :class="[element.showOpt ? '' : 'opacity0']" @click.stop>
<svgFont class="font-icon font-14" icon="move"></svgFont>
    </div>
    </div>
    </div>
    </template>
    </draggable>
    </template>

    <script setup>
import {ref, defineProps, defineEmits, computed, defineExpose} from 'vue'
import { useStore } from "vuex"
import bus from '@/utils/bus'
// hooks...
import { debounceFun } from '@/utils/tools'
// 组件
import draggable from 'vuedraggable'
import {ElMessageBox} from "element-plus"

const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

const store = useStore()

// expose
defineExpose({ clickProject })

// props
const props = defineProps({
    model: {
        type: Array,
        default: []
    },
    type: {
        type: String,
        default: ''
    },
})

// emits
const emits = defineEmits(['editCollection', 'knowledgeGraph', 'basics', 'removeCollection'])

// computed
const collectionActive = computed(() => store.state.notes.catalogActiveState.collectionActive)
const projectListSelf = computed(() => store.state.collection.projectListSelf)
const projectListTeam = computed(() => store.state.collection.projectListTeam)
const collectionList = computed({
    get: () => props.type === 'self' ? projectListSelf.value : projectListTeam.value,
    set: (value) => {
        let teamValues = null
        let selfValues = null
        if(props.type === 'self'){
            teamValues = projectListTeam.value.map((item) => item.id)
            selfValues = value.map((item) => item.id)
        }else{
            teamValues = value.map((item) => item.id)
            selfValues = projectListSelf.value.map((item) => item.id)
        }
        const finishValues = [...selfValues, ...teamValues]
        handleSortCollection(finishValues, value)
    }
})

// methods
// 右键
let elementParams,
    indexParams
const handleRightClick = (element, index) => {
    elementParams = element
    indexParams = index
    let menu = new Menu()
    if(props.type === 'self'){
        menu.append(new MenuItem({ label: '📂 编辑', click: editCollection }))
        menu.append(new MenuItem({ label: '🌟 知识图谱', click: knowledgeGraph }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({ label: '🗑 删除', click: removeCollection }))
    }else{
        // if(element.is_self === 1){
        //     menu.append(new MenuItem({ label: '📂 编辑', click: editCollection }))
        // }
        menu.append(new MenuItem({ label: '🌟 知识图谱', click: knowledgeGraph }))
    }
    menu.popup()
}

// 项目筛选
function clickProject(item){
    const collectionActive = store.state.notes.catalogActiveState.collectionActive
    const itemId = item.id
    const editNoteCount = store.state.notes.editNoteCount

    if( collectionActive === itemId ) return false
    if(editNoteCount > 0){
        ElMessageBox.confirm('还有正在编辑的卡片哦~', {
            type: 'warning',
            customClass: 'edit-note-message-box',
            confirmButtonText: "返回编辑 ",
            confirmButtonClass: 'edit-note-confirm-btn',
            cancelButtonText: '放弃保存',
            cancelButtonClass: 'edit-note-cancel-btn',
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
            distinguishCancelAndClose: true
        }).then().catch(() => {
            // bus.emit('closeEditorInstance')
            store.commit('notes/SET_EDIT_NOTE_COUNT')
            handleChangeCollection(item)
        })
        return false
    }

    debounceFun(() => {
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            short_note_count: item.short_note_count || 0
        })
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            long_note_count: item.long_note_count || 0
        })

        bus.emit("changeNotesListHeight")
        handleChangeCollection(item)
        bus.emit("clearFilterValue")
    })
}
function handleChangeCollection(item){
    store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
        collection_id: item.id,
        group_id: '',
        tag_id: '',
        trash: ''
    })
    store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
        collectionActive: item.id,
        collectionTitle: item.collection,
        tagGroupTitle: '',
        tagTitle: '',
        tagActive: '',
        trashActive: ''
    })
    store.commit("user/SHOW_NOTICE",{data: false})

    bus.emit("clearSearchKeyword")
    bus.emit("handleMakeListTop")
    store.dispatch("notes/getTagsList")
    store.dispatch("notes/getGroupInitial")
}

function editCollection(){
    emits('editCollection', {item: elementParams, index: indexParams})
}

function knowledgeGraph(){
    emits('knowledgeGraph', {item: elementParams, index: indexParams})
}

function basics(){
    emits('basics', {item: elementParams, index: indexParams})
}

function removeCollection(){
    emits('removeCollection', {item: elementParams, index: indexParams})
}

/**
 * 逻辑：
 * 1.选中样式拖拽，样式跟着走
 * 2.active上面的移动到下面，active向上移
 * 3.active下面的移动到上面，active向下移
 */
let drag = ref(false)
let nowCollectionType = ""
function startDrag(){
    drag.value = true
    nowCollectionType = props.type
}
function endDrag(e){
    drag.value = false
    const oldVal = e.oldIndex
    const newVal = e.newIndex

    const colVal = collectionActive.value

    if(colVal === oldVal){  // 移动的是选中的哪个
        sortCollection(newVal)
    }else if(colVal >= oldVal && newVal >= colVal){  // 上面的移动到选中的下面
        let nowVal = colVal - 1
        sortCollection(nowVal)
    }else if(colVal <= oldVal && newVal <= colVal){  // 下面的移动到选中的上面
        let nowVal = colVal + 1
        sortCollection(nowVal)
    }
}
function sortCollection(value){
    console.log('value', value)

    store.commit("notes/SORT_CHANGE_COLLECTION_ACTIVE",{
        collectionActive: value
    })
}

function handleSortCollection(finishValues, value){
    if(!finishValues.length > 0) return
    store.commit("collection/SORT_COLLECTION", { type: props.type, result: value })
    store.dispatch("collection/sortCollection", {
        collection_ids: finishValues.join(",")
    })
}

</script>

<style lang="scss" scoped>
.project{
    cursor: pointer;
    color: #6F7A93;
    display: block;
    line-height: 30px;
    font-size: 14px;
    border-radius: 4px;
    padding-left: 10px;
    margin: 4px 0;
&:hover{
        background: #f0f2fc;
    }

.project-title{
        display: flex;
        justify-content: space-between;
        align-items: center;
    .title{
            width: 100%;
        .color{
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 6px;
            }
        }
    .el-icon-s-tools{
            font-size: 16px;
            padding: 4px 6px;
            color: #999;
        }
    .options{
            border-radius: 4px;
            cursor: ns-resize;
        }
    }
}
.active-project{
    background: $purple !important;
    color: #ffffff;
    font-weight: 700;

.options{
    .font-icon{
            color: #FFFFFF !important;
        }
    }
}

// 透明
.opacity0{
    opacity: 0;
}
.opacity1{
    opacity: 1;
}
</style>
<style lang="scss">
.edit-note-message-box{
    width: 300px !important;
.edit-note-confirm-btn{
        background: $purple !important;
        border-color: $purple !important;
    &:focus-visible {
            outline: none;
            outline-offset: 0;
        }
    &:focus{
            background: $purple !important;
            opacity: 0.8;
        }
    &:hover{
            background: $purple !important;
            opacity: 0.8;
        }
    }
.edit-note-cancel-btn{
    &:focus-visible {
            outline: none;
            outline-offset: 0;
        }
    &:focus{
            background: #eeeeee !important;
            color: #999999;
            border-color: #cccccc;
        }
    &:hover{
            background: #eeeeee !important;
            color: #999999;
            border-color: #cccccc;
        }
    }
}
</style>