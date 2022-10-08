<template>
    <VueDragResize
            class="tags-manage-container"
            v-if="showTagsManage"
            :isActive="true"
            :z="999"
            :w="400" :h="500"
            :minw="250" :minh='400'
            :x="100" :y="100"
    >
        <div class="tags-manage-title unselectable flex justify-between align-center">
            <span class="title">标签管理器</span>
            <el-icon
                    :size="18"
                    class="cursor-p"
                    @click="emit('close')"
                    @mousedown="$event.stopPropagation()"><Close/></el-icon>
        </div>
        <div class="tags-manage" @mousedown="$event.stopPropagation()" @mouseup="$event.stopPropagation()">
            <div class="tabs f-flex unselectable">
                <div class="tab" @click="clickTab($event)">
                    <span data-type="pt" :class="groupInitial.activeTab === 'pt' && 'active'" class="mr10">普通标签</span>
                    <span data-type="fz" :class="groupInitial.activeTab === 'fz' && 'active'" class="mr20">分组标签</span>
                </div>
                <el-input
                        placeholder="搜索标签..."
                        :prefix-icon="Search"
                        ref="tagInputRef"
                        clearable
                        v-model="groupInitial.tagKeyword"
                        @change="searchGroupInitial">
                </el-input>
            </div>

            <div class="tags-group-list" v-show="groupInitial.activeTab === 'pt'">
                <div v-for='(item,index) in groupInitial.ptList' :key="index">
                    <el-divider content-position="center">
                        <span class="color-9 font-12">{{item.name}}</span>
                    </el-divider>
                    <div class="tags-box">
                        <tag-item
                                v-for="(tag,i) in item.list"
                                :key="tag.id"
                                :item="tag"
                                :index="i"
                        ></tag-item>
                    </div>
                </div>
            </div>
            <div class="tags-group-list" v-show="groupInitial.activeTab === 'fz'">
                <template v-if="groupInitial.fzList.length">
                    <div v-for='(item,index) in groupInitial.fzList' :key="index">
                        <el-divider content-position="center">
                            <span class="color-9 font-12">{{item.name}}123</span>
                        </el-divider>
                        <div class="group-tag" v-for="group in item.list" :key="group.id">
                            <div class="tags-group-title">
                                <p class="title">{{group.name}}</p>
                            </div>
                            <div class="tags-box unselectable">
                                <tag-item
                                        v-for="(tag,i) in group.list"
                                        :key="tag.id"
                                        :group="group"
                                        :item="tag"
                                        :index="i"
                                        from="group">
                                </tag-item>
                            </div>
                        </div>
                    </div>
                </template>
                <span v-else>你还没有创建分组标签~</span>
            </div>
        </div>
    </VueDragResize>
</template>

<script setup>
    import {computed, reactive, ref} from "vue"
    import { useStore } from "vuex"
    import { Search, Close } from '@element-plus/icons-vue'
    import VueDragResize from 'vue-drag-resize'
    import tagItem from "./tagItem.vue"

    const store = useStore()
    const emit = defineEmits(['close'])
    const { showTagsManage } = defineProps({
        showTagsManage: {
            type: Boolean,
            default: false
        }
    })

    let tagInputRef = ref(null)
    let groupInitial = reactive({
        tagKeyword: '',
        ptList: computed(() => store.state.notes.tagInitialList.pt),
        fzList: computed(() => store.state.notes.tagInitialList.fz),
        activeTab: 'pt'
    })
    function searchGroupInitial(){
        store.dispatch('notes/getGroupInitial', { keyword: groupInitial.tagKeyword })
    }
    function clickTab(event) {
        const dataset = event.target.dataset
        if(!dataset.type) return
        groupInitial.activeTab = dataset.type
    }
</script>

<style lang="scss" scoped>
    .tags-manage-container{
        background: #FFFFFF;
        padding: 14px;
        border-radius: 8px;
        box-shadow: 0px 0px 18px -4px rgba(0, 0, 0, 0.5);
        &:before{
            outline: 0px;
        }
        .tags-manage-title{
            font-size: 18px;
            font-weight: 700;
            color: #333333;
            padding-bottom: 16px;
            .title{
                width: calc(100% - 40px);
                cursor: all-scroll;
            }
        }
        .tags-manage{
            height: 100%;
            .tabs{
                font-size: 14px;
                color: #999999;
                line-height: 38px;
                .tab{
                    flex-shrink: 0;
                    span{
                        border-bottom: 2px solid #FFFFFF;
                        padding-bottom: 4px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    .active{
                        color: $purple;
                    }
                }
            }
            .tags-group-list{
                height: calc(100% - 80px);
                overflow: scroll;
                scrollbar-width: none;
                &::-webkit-scrollbar {
                    display: none;
                }
            }
            .group-tag{
                padding-bottom: 10px;
                .tags-group-title{
                    .title{
                        font-size: 14px;
                        color: #666666;
                        padding: 6px 4px;
                    }
                }
            }
        }
    }

    .tags-box{
        display: flex;
        flex-wrap: wrap;
    }

</style>