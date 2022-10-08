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
    import draggable from 'vuedraggable'

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
    let noteTypeActive = computed(() => store.state.notes.catalogActiveState.noteTypeActive)
    let projectListSelf = computed(() => store.state.collection.projectListSelf)
    let projectListTeam = computed(() => store.state.collection.projectListTeam)
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
        // store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
        //     collectionTitle: item.collection,
        //     collectionActived: item.id,
        //     collection_id: item.id
        // })
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

        // writeInfo
        setTimeout(() => {
            store.dispatch("notes/getTagsList")
            store.dispatch("notes/getGroupInitial")
            store.commit("notes/RECORD_COLLECTION",{
                checked_collection: item.collection,
                collection_id: item.id
            })
            store.commit("user/SHOW_NOTICE",{data: false})
            bus.emit("CLEAR_KAYWORD")
            bus.emit("MAKE_LIST_TOP")
        })
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