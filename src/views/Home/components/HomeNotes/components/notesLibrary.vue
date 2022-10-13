<template>
    <div class="short-note-contains note-style">
        <p class="title">全部卡片</p>
        <div class="pl10 pr10 pt10">
            <el-input
                    v-model="searchKeyword"
                    class="w-50 m-2"
                    placeholder="搜索笔记..."
                    @change="searchNote"
                    :prefix-icon="Search"
            />
        </div>
        <div class="filter f-flex pl10 pr10 pt10 pb10">
            <el-select
                    class="mr10"
                    v-model="collectionActive"
                    placeholder="筛选笔记本"
                    clearable
                    filterable
                    @change="changeCollection"
            >
                <el-option
                        v-for="item in collectionList"
                        :key="item.id"
                        :label="item.collection"
                        :value="item.id"
                />
            </el-select>
            <el-cascader
                    ref="tagSelectRef"
                    v-model="tagActive"
                    :options="tagsOptions"
                    :props="tagProps"
                    popper-class="tag-select-class"
                    clearable
                    filterable
                    placeholder="筛选标签"
                    @change="changeTags"
            />
        </div>
        <div
                class="note-list"
                v-infinite-scroll="loadNextNotes"
                :infinite-scroll-immediate="false"
                :infinite-scroll-distance="50"
        >
            <div
                    class="note-item"
                    v-for="item in notesList" :key="item.id"
            >
                <div class="note-header">
                    <div class="time">{{item.updated_at}}</div>
                    <div class="collection">{{item.collection?.collection}}</div>
                </div>
                <!--<div draggable="true" @dragstart="handleDragstart($event, item.note)">-->
                <!--    <div data-type="draggable-item">-->
                <!--        <div v-html='item.note'></div>-->
                <!--    </div>-->
                <!--</div>-->
                <a href="javascript:void(0);" draggable="true" @dragstart="handleDragstart($event, item)">
                    <blockquote contenteditable="false">
                        <div v-html='item.note'></div>
                    </blockquote>
                </a>
            </div>
            <el-divider>
                <span v-if="pagingStatus.isFinish" class="color-9 font-12">暂无更多</span>
                <template v-else>
                    <el-icon v-if="pagingStatus.isLoading" class="is_loading"><loading/></el-icon>
                    <span v-else class="color-9 font-12">加载更多 ~ </span>
                </template>
            </el-divider>
        </div>
    </div>
</template>

<script setup>
    import { computed, reactive, ref, onMounted } from "vue"
    import { useStore } from "vuex"
    import { getNotesApi } from "@/apiDesktop/notes"
    import { deepClone } from "@/utils/tools"
    import { getGroupListApi, getTagListApi } from "@/apiDesktop/tag"
    import { Search } from '@element-plus/icons-vue'

    const store = useStore()

    defineExpose({ getNoteList })

    onMounted(() => {
        getTagList()
    })

    const tagSelectRef = ref(null)
    const collectionActive = ref('')
    const tagActive = ref('')
    const notesList = ref([])
    let searchKeyword = ref('')
    let tagsList = ref([])
    let tagGroupList = ref([])
    let pagingStatus = reactive({
        isFinish: false,
        isLoading: false
    })
    const tagProps = {
        label: 'tag',
        value: 'id',
        children: 'list'
    }
    let isDown = false
    let noteParams = {
        user_id: store.state.user.userInfo.id,
        params: {
            collection_id: '',
            tag_id: '',
            group_id: '',
            keyword: '',
            today: 0,
            sort: 'desc',
            note_type: 1
        },
        trash: 0,
        page: 1,
        size: 30
    }
    let tagParams = {
        user_id: store.state.user.userInfo.id
    }

    const collectionList = computed(() => [...store.state.collection.projectListSelf, ...store.state.collection.projectListTeam])
    const tagsOptions = computed(() => {
        let list = []
        let topObj = {
            tag: "置顶标签",
            disabled: true
        }
        let topTagList = tagsList.value.filter(tag => tag.is_top === 1)
        if(topTagList.length) list.push(topObj)
        list = [...list, ...topTagList]

        let noTopObj = {
            tag: '普通标签',
            disabled: true
        }
        let noTopTagList = tagsList.value.filter(tag => tag.is_top === 0)
        if(noTopTagList.length) list.push(noTopObj)
        list = [...list, ...noTopTagList]

        let groupObj = {
            tag: '标签组',
            disabled: true
        }
        let groupList = tagGroupList.value.map(tag => {
            tag.tag = tag.name
            tag.id = tag.group_id
            return tag
        })
        if(groupList.length) list.push(groupObj)
        list = [...list, ...groupList]

        return list
    })


    function changeCollection(e){
        noteParams.params.collection_id = e
        tagParams.collection_id = e
        noteParams.page = 1
        notesList.value = []
        getNoteList()
        getTagList()
    }
    function changeTags(){
        const checkedNodes = tagSelectRef.value.getCheckedNodes()
        if(checkedNodes.length){
            const pathValues = checkedNodes[0].pathValues
            if(pathValues.length > 1){
                noteParams.params.group_id = pathValues[0]
                noteParams.params.tag_id = pathValues[1]
            }else{
                noteParams.params.group_id = ''
                noteParams.params.tag_id = pathValues[0]
            }
        }else{
            noteParams.params.group_id = ''
            noteParams.params.tag_id = ''
        }

        notesList.value = []
        noteParams.page = 1
        getNoteList()
    }

    function searchNote(){
        notesList.value = []
        noteParams.params.keyword = searchKeyword.value
        noteParams.page = 1
        getNoteList()
    }

    async function getNoteList(){
        pagingStatus.isLoading = true
        const res = await getNotesApi(deepClone(noteParams))
        if(res.status_code === 200){
            if(res.data.note) notesList.value = [...notesList.value, ...res.data.note]
            isDown = !res.data.note || res.data.note.length < noteParams.size
            pagingStatus.isFinish = !res.data.note || res.data.note.length < noteParams.size
        }
        pagingStatus.isLoading = false
    }
    async function getTagList(){
        const params1 = deepClone(tagParams)
        const res = await getTagListApi(params1)
        const params2 = deepClone(tagParams)
        const resGroup = await getGroupListApi(params2)
        if(res.status_code === 200){
            tagsList.value = res.data
        }
        if(resGroup.status_code === 200){
            tagGroupList.value = resGroup.data.filter(item => item.group_id)
        }
    }
    function loadNextNotes(){
        if(isDown) return false
        noteParams.page ++
        getNoteList()
    }
</script>

<style lang="scss" scoped>
    .short-note-contains{
        position: absolute;
        top: 100px;
        right: 0px;
        width: 280px;
        height: calc(100vh - 110px);
        background: #ffffff;
        z-index: 999;
        overflow: hidden;
        box-shadow: -4px 4px 10px 0px rgba(0, 0, 0, .1);
        .title{
            text-align: center;
            padding: 10px 0 0;
            font-size: 16px;
            color: #999999;
            font-weight: bold;
        }
        .filter{
            border-bottom: 1px solid #eeeeee;
        }
        .note-list{
            height: calc(100vh - 240px);
            overflow: scroll;
            scrollbar-color: transparent transparent;
            &::-webkit-scrollbar {
                display: none;
            }
            .note-header{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 10px 0 10px;
                .time, .collection{
                    color: #999999;
                    font-size: 12px;
                }
                .collection{
                    width: 110px;
                    overflow: hidden;
                    text-align: right;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
            }
            .note-item{
                margin: 10px;
                border-radius: 4px;
                background: #F6F8FC;
                transition: all .3s;
                a{
                    padding: 10px;
                    display: block;
                    color: #333333;
                    font-size: 14px;
                    text-decoration: none;
                    word-break: break-all;
                    blockquote{
                        margin: 0;
                    }
                }
                &:hover{
                    box-shadow: 2px 2px 10px -4px rgba(0,0,0, .5);
                }
            }
        }
    }
</style>