<template>
    <div class="tag flex align-center"
         v-if="item.note_count > 0"
         :class="[
            (item.id === tagActive && item?.group_id === tagGroupActive) ? 'active' : '',
            type === 'top' ? 'tag-top' : ''
        ]"
         @click="filterNoteList(item)"
         @contextmenu="handleRightClick()"
    >
        <span class="content line-1">#{{item.tag}}</span>
        <div class="num">
            <span>{{item.note_count}}</span>
        </div>
    </div>
</template>

<script setup>
    import {ref, defineProps, computed} from "vue";
    import bus from '@/utils/bus';
    import { useStore } from "vuex";
    import {ElMessageBox} from "element-plus";

    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;

    const store = useStore()
    const { group, item, index, type, from } = defineProps({
        group: {
            type: Object,
            default: {}
        },
        item: Object,
        index: Number,
        type:{
            type: String,
            default: 'noTop'
        },
        from: {
            type: String,
            default: 'ordinary'
        }
    })

    // 右键
    const handleRightClick = () => {
        let menu = new Menu()
        if(type === 'top'){
            menu.append(new MenuItem({ label: '🔽 取消置顶', click: setNoTop }))
        }else{
            menu.append(new MenuItem({ label: '⬆️ 置顶', click: setTop }))
        }
        menu.popup()
    }

    let tagActive = computed(() => store.state.notes.catalogActiveState.tagActive )
    let tagGroupActive = computed(() => {
        return store.state.notes.catalogActiveState.tagGroupActive
            ? store.state.notes.catalogActiveState.tagGroupActive : undefined
    })
    function filterNoteList({ id, tag, group_id = '' }){
        const editNoteCount = store.state.notes.editNoteCount
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
                bus.emit('closeEditorInstance')
                store.commit('notes/SET_EDIT_NOTE_COUNT')
                handleChangeTags({ id, tag, group_id })
            })
            return false
        }
        handleChangeTags({ id, tag, group_id })
    }
    function handleChangeTags({ id, tag, group_id }){
        setTimeout(() => {
            bus.emit("setTagToEditor", {
                tag: tag
            })

            store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
                tag_id: id,
                group_id: group_id,
            })
            store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
                tagActive: id,
                tagGroupActive: group_id,
                tagTitle: `#${tag}`,
                tagGroupTitle: group.name ? group.name : ''
            })

            store.commit("user/SHOW_NOTICE",{data: false})
            bus.emit("clearSearchKeyword")
            bus.emit("handleMakeListTop")
        })
    }

    // 置顶标签
    function setTop(){
        store.dispatch("notes/setTopTags",{
            tag_id: item.id
        })
    }
    // 取消置顶
    function setNoTop(){
        store.dispatch("notes/removeTopTags",{
            tag_id: item.id
        })
    }

</script>

<style lang="scss" scoped>
    .tag{
        color: #999;
        background: #f5f5f5;
        font-size: 12px;
        border-radius: 22px;
        cursor: pointer;
        margin: 6px;
        padding: 2px 14px;
        &:hover{
            color: #ffffff !important;
            background: $purple;
        }

        .content{
            display: inline-block;
            max-width: 150px;
            vertical-align: bottom;
        }
        .num{
            display: inline-block;
            text-align: center;
            padding-left: 6px;
        }
    }
    .active{
        color: #ffffff !important;
        background: $purple !important;
    }

    .tag-top{
        color: $purple;
        background: #edeaff;
    }
</style>
<style lang="scss">
    .tag{
        .el-dropdown{
            line-height: 18px;
        }
    }
</style>