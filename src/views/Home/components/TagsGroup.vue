<template>
    <div class="group-content">
        <template v-if="tagsGroupList?.length">
            <div class="label-title">标签组</div>
            <div class='group-box'
                 v-for="(group,gi) in tagsGroupList" :key="group"
                 :class="[gi === tagsGroupList.length -1 ? '' : 'border-bottom']"
            >
                <div class="tags-group flex justify-between align-center unselectable" @click="group.isShow = !group.isShow">
                    <p class="tag-title">{{group.name}}</p>
                    <font-awesome-icon v-show="!group.isShow" icon="plus" color="#999999"></font-awesome-icon>
                    <font-awesome-icon v-show="group.isShow" icon="minus" color="#999999"></font-awesome-icon>
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
            </div>
        </template>
        <p v-else class="noList">暂无标签组~</p>
        <div class="label-title pt6">普通标签</div>
        <div class="tags-box unselectable mt8" v-if="tagsList.length > 0">
            <template v-for="(item,index) in tagsList" :key="index">
                <tag-item :item="item" :index="index"></tag-item>
            </template>
        </div>
        <p v-else class="noList">暂无标签~</p>
    </div>
</template>

<script setup>
    import {ref, reactive, computed} from "vue"
    import { useStore } from "vuex";
    import bus from '@/utils/bus';
    import FCollapse from '@/components/FCollapse'
    import tagItem from './HomeSidebar/components/tagItem'

    const store = useStore()

    let tagsList = computed(() => { return store.state.notes.tagsList })
    let tagsTopList = computed(() => { return store.state.notes.tagsTopList })
    let tagsGroupList = computed(() => {
        return store.state.notes.tagsGroupList?.filter((item) => {
            return item.group_id && item.group_id !== '0' && item.list.length
        })
    })

    function getTagsGroupList(){
        store.dispatch('notes/getTagsGroup', { user_id: store.state.user.userInfo.id })
    }
    // getTagsGroupList()



    const defaultShowTags = computed(() => store.state.showTagsGroup)
    const fixedTagsGroup = () => {
        store.commit('SET_TAGS_GROUP')
    }

    function filterNoteList({id, tag}){
        bus.emit("SET_TEXT_EDITOR_TAG", {
            tag: tag
        })
        store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
            collectionTitle: store.state.notes.classifyObj.collectionTitle,
            tagTitle: `#${tag}`,
            tag_id: id,
            activedTag: id,
            collectionActived: store.state.notes.classifyObj.collectionActived,
            collection_id: store.state.notes.tagToCollectionId
        })
        store.commit("user/SHOW_NOTICE",{data: false});
        bus.emit("CLEAR_KAYWORD");
        bus.emit("MAKE_LIST_TOP");
    }
    // 取消置顶
    function setNoTop(tag_id, index){
        store.dispatch("notes/removeTopTags",{
            tag_id
        })
    }

</script>

<style lang="scss" scoped>
    .group-content{
        font-weight: normal;
        .fixed-tags{
            padding: 0 6px;
            cursor: pointer;
            border-radius: 4px;
            &:hover{
                background: #dddddd;
            }
        }
        .default-show{
            background: #dddddd;
        }
        .label-title{
            color: #999999;
            font-size: 14px;
            margin: 10px 0;
            font-weight: bold;
        }
        .tags-group{
            padding: 4px;
            border-radius: 4px;
            margin: 4px 0;
            &:hover{
                background: #eeeeee;
            }
            .tag-title{
                font-size: 14px;
                color: #666666;
            }
        }

        .tags-box{
            display: flex;
            flex-wrap: wrap;
            overflow: hidden;
        }
    }
    .noList{
        color: #999;
        font-size: 12px;
        text-align: center;
        margin: 10px 0;
    }
    .border-bottom{
        border-bottom: 1px solid #eeeeee;
    }
</style>