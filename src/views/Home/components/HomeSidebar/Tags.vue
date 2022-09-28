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
                    @click="showTagsManage = false"
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
                        @change="getGroupInitial">
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
                <div v-for='(item,index) in groupInitial.fzList' :key="index">
                    <el-divider content-position="center">
                        <span class="color-9 font-12">{{item.name}}</span>
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
            </div>
        </div>
    </VueDragResize>

    <!--<el-dialog-->
    <!--    v-model="showTagsManage"-->
    <!--    title="标签管理器"-->
    <!--    width="380px"-->
    <!--    :modal="false"-->
    <!--    destroy-on-close-->
    <!--    draggable-->
    <!--    :lock-scroll="false"-->
    <!--    :close-on-click-modal="false"-->
    <!--    :close-on-press-escape="false"-->
    <!--&gt;-->
    <!--    <div class="tags-manage">-->
    <!--        <el-input-->
    <!--            placeholder="搜索标签..."-->
    <!--            :prefix-icon="Search"-->
    <!--            clearable-->
    <!--            v-model="tagKeyword"-->
    <!--            @change="getGroupInitial">-->
    <!--        </el-input>-->
    <!--        <div class="tags-group-list">-->
    <!--            <div v-for='(item,index) in groupInitial' :key="index">-->
    <!--                <el-divider content-position="center">-->
    <!--                    <span class="color-9 font-12">{{item.name}}</span>-->
    <!--                </el-divider>-->
    <!--                <div class="tags-box">-->
    <!--                    <tag-item-->
    <!--                        v-for="(tag,i) in item.list"-->
    <!--                        :key="tag.id"-->
    <!--                        :item="tag"-->
    <!--                        :index="i"-->
    <!--                    ></tag-item>-->
    <!--                </div>-->
    <!--            </div>-->
    <!--        </div>-->
    <!--    </div>-->
    <!--</el-dialog>-->
</template>
<script setup>
    import {ref, computed, defineEmits, onMounted, reactive} from "vue";
    import { useStore } from "vuex";
    import bus from '@/utils/bus';
    import { ArrowRight, CaretRight, Search, Close } from '@element-plus/icons-vue'
    import FCollapse from '@/components/FCollapse'
    import tagItem from "./components/tagItem.vue"
    import VueDragResize from 'vue-drag-resize';

    const store = useStore();
    const emits = defineEmits(['openTagsGroup'])

    let userId = computed(() => store.state.user.userInfo.id)
    let tagsList = computed(() => store.state.notes.tagsList);
    let tagsTopList = computed(() => store.state.notes.tagsTopList);
    let tagsGroupList = computed(() => store.state.notes.tagsGroupList?.filter((item) => item.group_id && item.group_id !== '0' && item.list.length))

    function getTagsGroupList(){
        store.dispatch('notes/getTagsGroup')
    }

    // 控制标签分组的是否展开的状态
    const showTags = computed(() => store.state.notes.catalogState.showTags)
    function handleShowCatalog(){
        store.commit('notes/CHANGE_CATALOG_STATE', {
            showTags: !showTags.value
        })
    }

    let showTagsManage = ref(false)
    let tagInputRef = ref(null)
    let groupInitial = reactive({
        tagKeyword: '',
        ptList: [],
        fzList: [],
        activeTab: 'pt'
    })
    function getGroupInitial(){
        showTagsManage.value = true
        store.dispatch('notes/getGroupInitial', { keyword: groupInitial.tagKeyword }).then((res) => {
            console.log('getGroupInitial', res)
            if(res.status_code === 200){
                groupInitial.ptList = res.data.filter(tag => tag.is_default === 1)
                groupInitial.fzList = res.data.filter(tag => tag.is_default === 0)
            }
        })
    }
    function clickTab(event) {
        const dataset = event.target.dataset
        if(!dataset.type) return
        groupInitial.activeTab = dataset.type
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
    }

    .tags-box{
        display: flex;
        flex-wrap: wrap;
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

    .tags-manage-container{
        background: #FFFFFF;
        padding: 14px;
        border-radius: 8px;
        box-shadow: 0px 0px 14px -6px rgba(0, 0, 0, 0.5);
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

</style>
<style lang="scss">
    .tags-manage-container{
        .vdr-stick{
            opacity: 0;
        }
    }
</style>