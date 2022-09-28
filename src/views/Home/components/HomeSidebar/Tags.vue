<template>
    <div class="container-tag">
        <div class="tag-title unselectable flex justify-between align-center mb4" @click="handleShowCatalog">
            <div class="flex align-center">
                <div class="arrowRight mr6">
                    <el-icon :size="16" :class="!showTags ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'" color="#6F7A93"><CaretRight/></el-icon>
                </div>
                <svgFont class="font-16" color="#6F7A93" icon="tags"></svgFont>
                <span class="ml10 pt2">笔记标签</span>
            </div>
            <svgFont class="add-btn" color="#6F7A93" icon="manage" @click.stop="showTagsManage = true"></svgFont>
        </div>
        <f-collapse>
            <div class="tag-scroll" v-show="showTags">
                <!-- 置顶标签 -->
                <div class="tag-content" v-if="tagsTopList.length > 0">
                    <div class="tags-box unselectable">
                        <template v-for="(item,index) in tagsTopList" :key="index">
                            <tag-item :item="item" :index="index" type="top"></tag-item>
                        </template>
                    </div>
                </div>

                <!-- 分组标签-->
                <div class="" v-if="tagsGroupList?.length">
                    <div class='group-box'>
                        <template v-for="group in tagsGroupList" :key="group.id">
                            <div class="tags-group flex justify-between align-center unselectable" @click="group.isShow = !group.isShow">
                                <p class="tag-title">{{group.name}}</p>
                                <el-icon
                                        size='14px'
                                        class="angle-right"
                                        :class="!group.isShow ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'"
                                ><ArrowRight /></el-icon>
                            </div>
                            <f-collapse>
                                <div class="tags-box unselectable" v-show="group.isShow">
                                    <template v-for="(tag,index) in group.list" :key="tag.id">
                                        <tag-item :group="group" :item="tag" :index="index" from="group"></tag-item>
                                    </template>
                                </div>
                            </f-collapse>
                        </template>
                    </div>
                </div>

                <!-- 非置顶标签 -->
                <div class="tag-content" v-if="tagsList.length > 0">
                    <div class="tags-box unselectable">
                        <tag-item
                                v-for="(item,index) in tagsList"
                                :key="index"
                                :item="item"
                                :index="index"
                        ></tag-item>
                    </div>
                </div>
            </div>
        </f-collapse>
    </div>

    <el-dialog
            v-model="showTagsManage"
            title="标签管理器"
            width="500px"
            :modal="false"
            append-to-body
            destroy-on-close
            draggable
            :close-on-click-modal="false"
            :close-on-press-escape="false"
    >
        <div class="tags-manage">

        </div>
    </el-dialog>
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

    let tagsList = computed(() => store.state.notes.tagsList);
    let tagsTopList = computed(() => store.state.notes.tagsTopList);
    let tagsGroupList = computed(() => store.state.notes.tagsGroupList?.filter((item) => item.group_id && item.group_id !== '0' && item.list.length))

    function getTagsGroupList(){
        store.dispatch('notes/getTagsGroup', { user_id: store.state.user.userInfo.id })
    }

    // 控制标签分组的是否展开的状态
    const showTags = computed(() => store.state.notes.catalogState.showTags)
    function handleShowCatalog(){
        store.commit('notes/CHANGE_CATALOG_STATE', {
            showTags: !showTags.value
        })
    }

    let showTagsManage = ref(false)


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
                .add-btn{
                    opacity: 1;
                }
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
        .add-btn{
            opacity: 0;
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
            &:hover{
                background: #e6e6e6;
            }
            &:active{
                background: #e1e1e1;
            }
        }
        .tags-box{
            display: flex;
            flex-wrap: wrap;
        }
    }
    .tag-scroll{
        padding: 0 10px;
        .tag-content{
            padding: 10px;
        }
    }

    .group-box{
        .tags-box{
            padding: 10px 0;
        }
        .tags-group{
            padding: 2px 4px;
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

    .tags-manage{

    }
</style>