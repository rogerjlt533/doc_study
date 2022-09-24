<template>
    <div class="tag flex align-center"
         v-if="item.note_count > 0"
         :class="[
             (item.id === activedTag && item?.group_id === activedGroup) ? 'actived' : '',
             type === 'top' ? 'tag-top' : ''
         ]"
         @mouseenter="from !== 'group' ? item.showOptions = true : ''"
         @mouseleave="from !== 'group' ? item.showOptions = false : ''"
         @click="filterNoteList(item)"
         @contextmenu="handleRightClick()"
    >
        <span class="content line-1">#{{item.tag}}</span>
        <!-- <div class="options" @click.stop v-if="from !== 'group'">
            <span class="num" v-show="!item.showOptions">{{item.note_count}}</span>
            <el-dropdown class="dropdown" size="small" trigger="click">
                <font-awesome-icon class="options-btn font-14" v-show="item.showOptions" icon="ellipsis-h" color="#ffffff" />
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="setNoTop(item.id)" v-if="type==='top'">
                            <font-awesome-icon class="font-icon" icon="arrow-down" color="#9EA0AD" />取消置顶
                        </el-dropdown-item>
                        <el-dropdown-item @click="setTop(item.id)" v-else>
                            <font-awesome-icon class="font-icon" icon="arrow-up" color="#9EA0AD" />置顶
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div> -->
        <div class="options">
            <span class="num">{{item.note_count}}</span>
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

    let activedTag = computed(() => { return store.state.notes.classifyObj.activedTag });
    let activedGroup = computed(() => { return store.state.notes.classifyObj.activedGroup });
    function filterNoteList({id, tag, group_id = undefined}){
        bus.emit('CHANGE_NOTE_MODE', false)
        setTimeout(() => {
            bus.emit("SET_TEXT_EDITOR_TAG", {
                tag: tag
            })
            store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
                collectionTitle: store.state.notes.classifyObj.collectionTitle,
                groupTitle: group.name ? group.name : '',
                tagTitle: `#${tag}`,
                tag_id: id,
                activedTag: id,
                activedGroup: group_id,
                collectionType: store.state.notes.classifyObj.collectionType,
                collectionActived: store.state.notes.classifyObj.collectionActived,
                collection_id: store.state.notes.tagToCollectionId
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
        border-radius: 4px;
        cursor: pointer;
        margin: 4px 8px 4px 0;
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
        .options{
            display: inline-block;
            padding: 2px 4px 2px 2px;
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
            &:hover{
                background: $purple;
                color: #ffffff;
            }
            .dropdown{
                vertical-align: text-bottom;
            }
            .options-btn{
                display: inline-block;
                width: 22px;
                text-align: center;
                border-radius: 2px;
            }
            .num{
                display: inline-block;
                width: 22px;
                text-align: center;
            }

        }
    }
    .actived{
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