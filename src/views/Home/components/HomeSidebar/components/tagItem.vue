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

        bus.emit('CHANGE_NOTE_MODE', false)
        setTimeout(() => {
            bus.emit("SET_TEXT_EDITOR_TAG", {
                tag: tag
            })
            // store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
            //     collectionTitle: store.state.notes.classifyObj.collectionTitle,
            //     groupTitle: group.name ? group.name : '',
            //     tagTitle: `#${tag}`,
            //     tag_id: id,
            //     activedTag: id,
            //     activedGroup: group_id,
            //     collectionActived: store.state.notes.classifyObj.collectionActived,
            //     collection_id: store.state.notes.tagToCollectionId
            // })

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
            bus.emit("CLEAR_KAYWORD")
            bus.emit("MAKE_LIST_TOP")
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
        border: 1px solid #ccc;
        color: #999;
        font-size: 12px;
        border-radius: 22px;
        cursor: pointer;
        margin: 2px;
        &:hover{
            border: 1px solid $purple;
            color: #ffffff !important;
            background: $purple;
        }

        .content{
            display: inline-block;
            max-width: 150px;
            vertical-align: bottom;
            padding: 2px 2px 2px 6px;
        }
        .num{
            display: inline-block;
            width: 22px;
            text-align: center;
        }
    }
    .active{
        border: 1px solid $purple;
        color: #ffffff !important;
        background-image: linear-gradient($purple, $purple);
    }

    .tag-top{
        border: 1px solid $purple;
        color: $purple;
    }
</style>
<style lang="scss">
    .tag{
        .el-dropdown{
            line-height: 18px;
        }
    }
</style>