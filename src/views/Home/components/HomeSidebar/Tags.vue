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
                            type="top">
                    </tag-item>
                </div>
                <div class="none-tag" v-else>
                    <span>没有置顶标签~</span>
                </div>
            </div>
        </f-collapse>
    </div>

    <transition name="show">
        <tagManage
                :showTagsManage="showTagsManage"
                @close="showTagsManage = false"
        ></tagManage>
    </transition>
</template>
<script setup>
    import {ref, computed, defineEmits, defineAsyncComponent} from "vue"
    import { useStore } from "vuex";
    import { CaretRight } from '@element-plus/icons-vue'
    import FCollapse from '@/components/FCollapse'
    import tagItem from "./components/tagItem.vue"
    const tagManage = defineAsyncComponent(() => import('./components/tagManage'))

    const store = useStore();
    const emits = defineEmits(['openTagsGroup'])

    let tagsTopList = computed(() => store.state.notes.tagsTopList)

    // 控制标签分组的是否展开的状态
    const showTags = computed(() => store.state.notes.catalogState.showTags)
    function handleShowCatalog(){
        store.commit('notes/CHANGE_CATALOG_STATE', {
            showTags: !showTags.value
        })
    }

    let showTagsManage = ref(false)
    function getGroupInitial(){
        showTagsManage.value = true
        store.dispatch('notes/getGroupInitial')
    }
</script>

<style lang="scss" scoped>
    .container-tag{
        padding-bottom: 20px;
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
        .tag-content{
            padding: 0 10px;
        }
        .none-tag{
            font-size: 12px;
            color: #999999;
            line-height: 40px;
            text-align: center;
        }
    }

    .tags-box{
        display: flex;
        flex-wrap: wrap;
    }

    .show-enter-active, .show-leave-active  {
        opacity: 1;
        transition: all .3s ease;
    }
    .show-enter-from, .show-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
</style>
<style lang="scss">
    .tags-manage-container{
        .vdr-stick{
            opacity: 0;
        }
    }
</style>