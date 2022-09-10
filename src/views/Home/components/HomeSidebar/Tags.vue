<template>
    <div class="container-tag">
        <div class="tag-title unselectable flex justify-between align-center mb4" @click="handleShowCatalog">
            <div class="flex align-center">
                <div class="arrowRight mr6">
                    <el-icon :size="16" :class="!showTags ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'"
                             color="#6F7A93">
                        <CaretRight/>
                    </el-icon>
                </div>
                <svgFont class="font-16" color="#6F7A93" icon="tags"></svgFont>
                <span class="ml10 pt2">笔记标签</span>
            </div>
            <svgFont class="add-btn" color="#6F7A93" icon="manage" @click.stop="getGroupInitial"></svgFont>
        </div>
        <f-collapse>
            <div class="tag-content" v-show="showTags">
                <div class="tags-box unselectable" v-if="tagsTopList.length > 0">
                    <tag-item
                            v-for="(item,index) in tagsTopList"
                            :key="item.id"
                            :item="item"
                            :index="index"
                            type="top"
                            @clickTagItem="handleClickTag"
                            @setTopTags="setTopTags"
                            @removeTopTags="removeTopTags"
                    >
                    </tag-item>
                </div>
                <div class="none-tag" v-else>
                    <span>没有置顶标签~</span>
                </div>
            </div>
        </f-collapse>
    </div>
</template>
<script setup>
    import { ref, computed, defineEmits, defineAsyncComponent } from "vue"
    import { useStore } from "vuex"
    import { CaretRight } from '@element-plus/icons-vue'
    import FCollapse from '@/components/FCollapse'
    import tagItem from "@/components/tagItem.vue"
    import { ipcRenderer } from "electron"
    import { ElMessageBox } from "element-plus"
    import bus from "@/utils/bus"
    import { handleLoopSave } from "./js/saveEditNote"

    const store = useStore()
    const emits = defineEmits(['openTagsGroup'])

    let tagsTopList = computed(() => store.state.notes.tagsTopList)

    // 控制标签分组的是否展开的状态
    const showTags = computed(() => store.state.notes.catalogState.showTags)

    function handleShowCatalog() {
        store.commit('notes/CHANGE_CATALOG_STATE', {
            showTags: !showTags.value
        })
    }

    function getGroupInitial() {
        ipcRenderer.send('openTagManage')
        const isTrash = store.state.notes.catalogActiveState.trashActive
        if (isTrash) {
            store.dispatch('notes/getGroupTrashInitial')
        } else {
            store.dispatch('notes/getGroupInitial')
        }
    }

    ipcRenderer.on('handleTagManageItem', (event, params) => {
        handleClickTag(params)
    })
    ipcRenderer.on('handleSetTopTag', (event, params) => {
        setTopTags({tag_id: params.tag_id})
    })
    ipcRenderer.on('handleSearchTagManage', (event, params) => {
        searchGroupInitial(params)
    })

    const handleClickTag = (e) => {
        const {id, tag, group_id} = e
        const editNotes = store.state.notes.editNotes
        if (JSON.stringify(editNotes) !== '{}') {
            ElMessageBox.confirm('还有正在编辑的卡片哦~', {
                type: 'warning',
                customClass: 'edit-note-message-box',
                confirmButtonText: "保存",
                confirmButtonClass: 'edit-note-confirm-btn',
                cancelButtonText: '放弃',
                cancelButtonClass: 'edit-note-cancel-btn',
                showClose: false,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                distinguishCancelAndClose: true
            }).then(() => {
                handleLoopSave(editNotes, {id, tag, group_id}, handleChangeTags)
            }).catch(() => {
                store.commit("notes/CLEAR_EDITE_NOTE_OBJ")
                handleChangeTags({id, tag, group_id})
            })
            return false
        }
        handleChangeTags({id, tag, group_id})
    }

    function handleChangeTags({id, tag, group_id}) {
        const noteType = store.state.notes.catalogActiveState.noteTypeActive
        bus.emit("clearFilterValue")
        if(noteType === 1){
            bus.emit("setTagToEditor", {
                tag: tag
            })
        }

        store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
            tag_id: id,
            group_id: group_id,
        })
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            tagActive: id,
            tagGroupActive: group_id,
            tagTitle: `#${tag}`
        })

        // store.commit("user/SHOW_NOTICE", {data: false})
        bus.emit("clearSearchKeyword")
        bus.emit("handleMakeListTop")
    }

    // 置顶标签
    function setTopTags(e) {
        store.dispatch("notes/setTopTags", e)
    }

    // 取消置顶
    function removeTopTags(e) {
        store.dispatch("notes/removeTopTags", e)
    }

    // 关键词搜索
    function searchGroupInitial(params) {
        const isTrash = store.state.notes.catalogActiveState.trashActive
        if (isTrash) {
            store.dispatch('notes/getGroupTrashInitial', params)
        } else {
            store.dispatch('notes/getGroupInitial', params)
        }
    }

</script>

<style lang="scss" scoped>
    .container-tag {
        padding-bottom: 20px;

        .tag-title {
            color: #3e3e3e;
            padding: 4px 10px;
            border-radius: 4px;

            &:hover {
                background: #eeeeee;
            }

            .tags-icon {
                color: #9EA0AD;
            }

            span {
                font-size: 14px;
                color: #6F7A93;
            }

            .tags-more {
                font-size: 14px;
                color: #999999;
                cursor: pointer;
            }
        }

        .add-btn {
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;

            &:hover {
                background: #e6e6e6;
            }

            &:active {
                background: #e1e1e1;
            }
        }

        .tag-content {
            padding: 0 10px;
        }

        .none-tag {
            font-size: 12px;
            color: #999999;
            line-height: 40px;
            text-align: center;
        }
    }

    .tags-box {
        display: flex;
        flex-wrap: wrap;
    }

    .show-enter-active, .show-leave-active {
        opacity: 1;
        transition: all .3s ease;
    }

    .show-enter-from, .show-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
</style>
<style lang="scss">
    .tags-manage-container {
        .vdr-stick {
            opacity: 0;
        }
    }
</style>