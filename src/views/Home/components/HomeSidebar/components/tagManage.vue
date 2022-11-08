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
            <span class="title">我的标签</span>
            <el-input
                    class="mr10"
                    placeholder="搜索标签..."
                    :prefix-icon="Search"
                    ref="tagInputRef"
                    clearable
                    v-model="groupInitial.tagKeyword"
                    @input="searchGroupInitial"
                    @change="searchGroupInitial">
            </el-input>
            <el-icon
                    :size="18"
                    class="close-btn cursor-p"
                    @click="closeManage"
                    @mousedown="$event.stopPropagation()"><Close/></el-icon>
        </div>
        <div class="tags-manage" @mousedown="$event.stopPropagation()" @mouseup="$event.stopPropagation()">
            <div class="tabs unselectable">
                <div class="tab" @click="clickTab($event)">
                    <span data-type="pt" :class="groupInitial.activeTab === 'pt' && 'active'" class="mr10">普通标签</span>
                    <span data-type="fz" :class="groupInitial.activeTab === 'fz' && 'active'" class="mr20">分组标签</span>
                </div>
            </div>

            <div class="tags-group-list" v-show="groupInitial.activeTab === 'pt'">
                <template v-if="groupInitial.ptList.length">
                    <div class="tags-group-item" v-for='(item,index) in groupInitial.ptList' :key="index">
                        <span class="name color-9 font-12">{{item.name}}</span>
                        <div class="tags-box">
                            <tag-item
                                    v-for="(tag,i) in item.list"
                                    :key="tag.id"
                                    :item="tag"
                                    :index="i"
                            ></tag-item>
                        </div>
                    </div>
                </template>
                <div v-else>
                    <p class="text-center font-12 color-9 pt20">你还没有创建标签~</p>
                    <p class="urlA cursor-p text-center font-12 color-9 pt10" @click="openUrlByBrowser('https://help.fangcun.in/help/tag.html')">如何创建？</p>
                </div>
            </div>
            <div class="tags-group-list" v-show="groupInitial.activeTab === 'fz'">
                <template v-if="groupInitial.fzList.length">
                    <div class="tags-group-item" v-for='(item,index) in groupInitial.fzList' :key="index">

                        <span class="name color-9 font-12">{{item.name}}</span>
                        <div>

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
                    </div>
                </template>
                <div v-else>
                    <p class="text-center font-12 color-9 pt20">
                        你还没有创建分组标签~
                    </p>
                    <p class="urlA cursor-p text-center font-12 color-9 pt10" @click="openUrlByBrowser('https://help.fangcun.in/help/group.html')">如何使用？</p>
                </div>
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
    import openUrlByBrowser from "@/assets/js/openUrlByBrowser";

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
    let timer = null
    function searchGroupInitial(){
        const isTrash = store.state.notes.catalogActiveState.trashActive
        if(timer) clearTimeout(timer)
        timer = setTimeout(() => {
            if(isTrash){
                store.dispatch('notes/getGroupTrashInitial', { keyword: groupInitial.tagKeyword })
            }else{
                store.dispatch('notes/getGroupInitial', { keyword: groupInitial.tagKeyword })
            }
        }, 500)
    }
    function clickTab(event) {
        const dataset = event.target.dataset
        if(!dataset.type) return
        groupInitial.activeTab = dataset.type
    }

    function closeManage(){
        emit('close')
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
            padding-bottom: 12px;
            border-bottom: 1px solid #eeeeee;
            .title{
                width: calc(100% - 40px);
                cursor: all-scroll;
            }
            .close-btn{
                padding: 6px;
                border-radius: 4px;
                &:hover{
                    background: #eeeeee;
                }
            }
        }
        .tags-manage{
            height: 100%;
            .tabs{
                @include flexAlignJustify(center, flex-start);
                font-size: 14px;
                color: #333333;
                line-height: 38px;
                .tab{
                    flex-shrink: 0;
                    span{
                        padding: 4px 8px;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: all 0.3s;
                    }
                    .active{
                        background: #dcdcf9;
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
                .tags-group-item{
                    @include flexAlignJustify(center, flex-start);
                    background: #f6f8fc;
                    padding: 10px;
                    border-radius: 4px;
                    margin: 8px 0;
                    .name{
                        display: block;
                        padding: 2px 8px;
                        border-radius: 50%;
                        background: #e3e4f0;
                        margin-right: 10px;
                    }
                }
                .urlA{
                    &:hover{
                        color: $purple;
                    }
                }
            }
            .group-tag{
                padding-bottom: 10px;
                .tags-group-title{
                    .title{
                        font-size: 12px;
                        color: #79849d;
                        padding: 6px 4px 6px 10px;
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