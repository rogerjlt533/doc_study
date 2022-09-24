<template>
    <div class="container-tag">
        <div class="tag-title unselectable flex justify-between align-center mb4" @click="showTag = !showTag">
            <div class="flex align-center">
                <div class="arrowRight mr6">
                    <el-icon :size="16" :class="!showTag ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'" color="#6F7A93"><CaretRight/></el-icon>
                </div>
                <svgFont class="font-16" color="#6F7A93" icon="tags"></svgFont>
                <span class="ml10 pt2">笔记标签</span>
            </div>
        </div>
        <f-collapse>
            <div v-show="showTag">
                <div class="tag-scroll">
                    <!-- 置顶标签 -->
                    <template v-if="tagsTopList.length > 0">
                        <p class="font-12 color-9 pl10">置顶标签</p>
                        <div class="tags-box unselectable">
                            <template v-for="(item,index) in tagsTopList" :key="index">
                                <tag-item :item="item" :index="index" type="top"></tag-item>
                            </template>
                        </div>
                    </template>

                    <!-- 分组标签-->
                    <template v-if="tagsGroupList?.length">
                        <p class="font-12 color-9 pl10">分组标签</p>
                        <div class='group-box'>
                            <template v-for="group in tagsGroupList" :key="group">
                                <div class="tags-group flex justify-between align-center unselectable" @click="group.isShow = !group.isShow">
                                    <p class="tag-title">{{group.name}}</p>
                                    <!--<font-awesome-icon-->
                                    <!--    class="angle-right"-->
                                    <!--    :style="{transform: !group.isShow ? 'rotate(0)' : 'rotate(90deg)'}" icon="angle-right" color="#999999"-->
                                    <!--&gt;</font-awesome-icon>-->
                                    <el-icon
                                            size='14px'
                                            class="angle-right"
                                            :style="{transform: !group.isShow ? 'rotate(0)' : 'rotate(90deg)'}"
                                    ><ArrowRight /></el-icon>
                                </div>
                                <template v-if="group.list.length">
                                    <f-collapse>
                                        <div class="tags-box unselectable" v-show="group.isShow">
                                            <template v-for="(tag,index) in group.list" :key="tag.id">
                                                <tag-item :group="group" :item="tag" :index="index" from="group"></tag-item>
                                            </template>
                                        </div>
                                    </f-collapse>
                                </template>
                            </template>
                        </div>
                    </template>

                    <!-- 非置顶标签 -->
                    <template v-if="tagsList.length > 0">
                        <p class="font-12 color-9 pl10">普通标签</p>
                        <div class="tags-box unselectable mt8">
                            <tag-item
                                    v-for="(item,index) in tagsList"
                                    :key="index"
                                    :item="item"
                                    :index="index"
                            ></tag-item>
                        </div>
                    </template>

                </div>
            </div>
        </f-collapse>
    </div>
</template>
<script setup>
    import {ref, computed, defineEmits, onMounted} from "vue";
    import { useStore } from "vuex";
    import bus from '@/utils/bus';
    import { ArrowRight, CaretRight } from '@element-plus/icons-vue'
    import FCollapse from '@/components/FCollapse'
    import tagItem from "./components/tagItem.vue"

    const store = useStore();
    const emits = defineEmits(['openTagsGroup'])

    let showTag = ref(false)
    let tagsList = computed(() => store.state.notes.tagsList);
    let tagsTopList = computed(() => store.state.notes.tagsTopList);
    let tagsGroupList = computed(() => store.state.notes.tagsGroupList?.filter((item) => item.group_id && item.group_id !== '0' && item.list.length))
    // 筛选笔记列表
    function filterNoteList({id, tag}){
        bus.emit("SET_TEXT_EDITOR_TAG", {
            tag: tag
        })
        store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
            collectionTitle: store.state.notes.classifyObj.collectionTitle,
            tagTitle: `#${tag}`,
            tag_id: id,
            activedTag: id,
            collectionType: store.state.notes.classifyObj.collectionType,
            collectionActived: store.state.notes.classifyObj.collectionActived,
            collection_id: store.state.notes.tagToCollectionId
        })
        store.commit("user/SHOW_NOTICE",{data: false});
        bus.emit("CLEAR_KAYWORD");
        bus.emit("MAKE_LIST_TOP");
    }

    function getTagsGroupList(){
        store.dispatch('notes/getTagsGroup', { user_id: store.state.user.userInfo.id })
    }

    onMounted(() => {
        getTagsGroupList()
    })
</script>

<style lang="scss" scoped>
    .container-tag{
        .tag-title{
            color: #3e3e3e;
            padding: 4px 10px;
            border-radius: 4px;
            &:hover{
                background: #eeeeee;
            }
            .tags-icon{
                color: #9EA0AD;
            }
            span{
                font-size: 14px;
                color: #6F7A93;
            }
            .tags-more{
                font-size: 14px;
                color: #999999;
                cursor: pointer;
            }
        }
        .tags-box{
            display: flex;
            flex-wrap: wrap;
            margin: 10px;
        }
    }
    .group-box{
        margin: 10px 6px;
        .tags-box{
            margin: 10px 0;
        }
        .tags-group{
            padding: 4px;
            border-radius: 4px;
            margin: 2px 0;
            &:hover{
                background: #eeeeee;
            }
            .tag-title{
                font-size: 12px;
                color: #666666;
            }
            .angle-right{
                transition: all 0.3s;
            }
        }
    }
    .border-bottom{
        border-bottom: 1px solid #eeeeee;
    }
</style>