<template>
    <div class="header-toolbar">
        <div class="filter flex">
            <div v-show="showSearchInput">
                <el-autocomplete
                        ref="autocompleteRef"
                        class="search-input"
                        placeholder="搜索笔记..."
                        v-model="keyword"
                        :prefix-icon="Search"
                        :fetch-suggestions="getHistoryList"
                        clearable
                        select-when-unmatched
                        @select="inputSearch"
                        @change="inputSearch"
                >
                    <template #default="data">
                        <div class="history-item">
                            <span class="history-item-value">{{ data.item.value }}</span>
                            <div class="history-item-close" @click.stop="removeHistory(data.item.value)">
                                <el-icon><Close/></el-icon>
                            </div>
                        </div>
                    </template>
                    <template #append>
                        <el-popover
                                :visible="showSeniorSearch"
                                placement="bottom-end"
                                :width="300"
                                :hide-after="0"
                                :show-arrow="false"
                        >
                            <div class="senior-search">
                                <p class="font-14 color-6">搜索条件</p>
                                <div class="pt10 pb10">
                                    <el-date-picker
                                            v-model="dateValue"
                                            type="daterange"
                                            range-separator="To"
                                            start-placeholder="开始时间"
                                            end-placeholder="结束时间"
                                            value-format="YYYY-MM-DD"
                                            @change="changeDateValue"
                                            style="width: 250px"
                                    />
                                    <div class="search-weight mt10">
                                        <span class="font-14 color-6">排序规则</span>
                                        <el-cascader
                                                v-model="filterValue"
                                                :options="filterOptions"
                                                style="width: 180px"
                                        ></el-cascader>
                                    </div>
                                </div>
                                <div class="flex justify-end">
                                    <el-button plain color="#999999" size="small" @click="cancelInputSearch">取消</el-button>
                                    <el-button color="#6C56F6" size="small" @click="inputSearch">搜索</el-button>
                                </div>
                            </div>
                            <template #reference>
                                <el-button :icon="Operation" @click="showSeniorSearch = !showSeniorSearch"></el-button>
                            </template>
                        </el-popover>
                    </template>
                </el-autocomplete>
            </div>
            <div class="time-item" v-if="timeItem && timeItem !== 'undefined'">
                <span class="ml6 mr6">{{ timeItem }}</span>
                <font-awesome-icon icon="xmark" class="font-12 cursor-p" color="#9EA0AD" @click="clearTimeItem" />
            </div>
        </div>
        <div class="header-toolbar-options flex">
            <el-button color="#6C56F6" :icon="Switch" round @click="changeWriteModel">{{writeTypeText}}</el-button>
            <div class="options flex">
                <el-popover
                        placement="bottom-end"
                        :width="160"
                        trigger="click"
                >
                    <template #reference>
                        <el-avatar class="ml12" :size="32" fit="fill" :src="userInfo?.avatar" />
                    </template>
                    <template #default>
                        <userMenu></userMenu>
                    </template>
                </el-popover>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, defineAsyncComponent, ref, watch, onBeforeUnmount } from "vue"
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // 组件
    import { Search, Switch, Operation, Close } from '@element-plus/icons-vue'
    const userMenu = defineAsyncComponent(() => import('./components/userMenu.vue'))

    const store = useStore()

    // emit -------------------
    const emit = defineEmits([
        'changeWrite'
    ])
    // props ------------------
    const props = defineProps({
        isWrite: {
            type: Boolean
        }
    })

    // computed ---------------
    let userInfo = computed(() => store.state.user.userInfo)
    let noteTypeActive = computed(() => store.state.notes.catalogActiveState.noteTypeActive)
    let showSearchInput = computed(() => {
        const type = noteTypeActive.value
        const showWriteMenu = store.state.notes.showWriteMenu
        let isShow = false
        if(type === 2 && !showWriteMenu){
            isShow = false
        }else{
            isShow = true
        }
        return isShow
    })

    // 切换写作模式
    let writeTypeText = ref(noteTypeActive.value === 2 ? '卡片速记' : '写作模式')
    watch(() => noteTypeActive.value, (newVal) => {
        writeTypeText.value = newVal === 2 ? '卡片速记' : '写作模式'
    })
    function changeWriteModel(){
        const isTrash = store.state.notes.catalogActiveState.trashActive
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            noteTypeActive: noteTypeActive.value === 1 ? 2 : 1
        })
        store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
            note_type: noteTypeActive.value
        })
        store.dispatch("notes/getTagsList")
        if(isTrash){
            store.dispatch('notes/getGroupTrashInitial')
        }else{
            store.dispatch('notes/getGroupInitial')
        }
    }

    // 搜索方法
    let cacheFilterValue = null
    let cacheDataValue = []
    const filterOptions = [
        {
            value: 1,
            label: '创建时间',
            children: [
                {
                    value: 'desc',
                    label: '近期优先',
                },{
                    value: 'asc',
                    label: '早期优先',
                },
            ]
        }, {
            value: 0,
            label: '更新时间',
            children: [
                {
                    value: 'desc',
                    label: '近期优先',
                },{
                    value: 'asc',
                    label: '早期优先',
                },
            ]
        }, {
            value: 2,
            label: '推荐排序'
        }
    ]
    let keyword = ref('')
    let showSeniorSearch = ref(false)
    const filterValue = computed({
        get: () => {
            let orderby_create = store.state.notes.notes.orderby_create
            let sort = store.state.notes.notes.sort
            let orderby_weight = !!store.state.notes.notes.orderby_weight

            if(orderby_weight){
                cacheFilterValue = [2]
            }else{
                cacheFilterValue = [orderby_create, sort]
            }

            return cacheFilterValue
        },
        set: (e) => {
            cacheFilterValue = e
        }
    })
    const dateValue = computed({
        get: () => {
            cacheDataValue = [
                store.state.notes.catalogActiveState.start_time,
                store.state.notes.catalogActiveState.end_time
            ]
            return cacheDataValue
        },
        set: (e) => {
            store.commit("notes/CHANGE_CATALOG_ACTIVE_STATE", {
                start_time: e ? e[0] : '',
                end_time: e ? e[1] : ''
            })
            cacheDataValue = e
        }
    })
    let timeItem = computed(() => {
        const start_time = store.state.notes.notes.start_time
        const end_time = store.state.notes.notes.end_time
        if (start_time && end_time && start_time !== end_time) {
            return `${start_time} ~ ${end_time}`
        } else if ((start_time && !end_time) || (start_time === end_time)) {
            return `${start_time}`
        } else {
            return ''
        }
    })
    async function inputSearch(){
        store.commit("notes/CHANGE_FILTER_NOTE_PARAMS", {
            keyword: keyword.value,
            start_time: cacheDataValue ? cacheDataValue[0] : '',
            end_time: cacheDataValue ? cacheDataValue[1] : '',
            orderby_create: cacheFilterValue[0] !== 2 ? cacheFilterValue[0] : 0,
            orderby_weight: cacheFilterValue[0] === 2 ? 1 : 0,
            sort: cacheFilterValue[1],
        })
        await nextTick()
        bus.emit('handleSearchNote',{
            keyword: keyword.value
        })
        store.commit('notes/ADD_SEARCH_HISTORY_LIST', keyword.value)
        showSeniorSearch.value = false
    }
    function cancelInputSearch(){
        showSeniorSearch.value = false
    }
    function changeDateValue(e){
        dateValue.value = e
        cacheDataValue = e
    }
    bus.on('clearFilterValue', () => {
        keyword.value = ""
        store.commit("notes/CHANGE_FILTER_NOTE_PARAMS", {
            start_time: '',
            end_time: ''
        })
    })
    // 历史搜索
    let searchHistoryList = computed(() => store.state.notes.searchHistoryList)
    const autocompleteRef = ref(null)
    function getHistoryList(){
        return searchHistoryList.value
    }
    function removeHistory(item){
        autocompleteRef.value.activated = true
        store.commit('notes/REMOVE_SEARCH_HISTORY_LIST', item)
    }
    // 清除时间选择
    function clearTimeItem(){
        cacheDataValue = ''
        store.commit("notes/CHANGE_FILTER_NOTE_PARAMS", {
            start_time: '',
            end_time: ''
        })
        store.commit("notes/CHANGE_CATALOG_ACTIVE_STATE", {
            start_time: '',
            end_time: ''
        })
        bus.emit('handleSearchNote',{
            keyword: keyword.value
        })
    }


    onBeforeUnmount(() => {
        bus.off('clearFilterValue')
    })

</script>

<style lang="scss" scoped>
    .header-toolbar{
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 36px;
        padding: 7px 10px;
        border-bottom: 1px solid #DEDEDE;
        -webkit-app-region: drag;
        .fold-icon{
            display: flex;
            align-items: center;
            .icon-angles-left{
                color: $purple2;
                font-size: 16px;
                padding: 4px;
                border-radius: 2px;
                transform: rotate(180deg);
                &:hover{
                    background: rgba($color: $purple, $alpha: 0.1);
                }
            }
        }
        .filter{
            position: relative;
            margin-right: 10px;
            .search-input {
                width: 240px;
            }
        }
        .time-item{
            font-size: 12px;
            color: #666666;
            line-height: 32px;
        }


        .header-toolbar-options{
            height: 32px;
        }

    }

    .btn-hover:hover{
        background: #cccccc;
        color: $purple;
    }

    .search-weight{
        padding-right: 4px;
        @include flexAlignJustify(center, space-between);
    }

    .keyword-list{
        display: flex;
        align-items: center;
        flex-wrap: wrap;
    }

    .history-item{
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 240px;
        color: #666666;
        font-size: 14px;
        line-height: 24px;
        padding: 4px 0;
        cursor: pointer;

        &-value{
            width: 90%;
            white-space: break-spaces;
            word-break: break-all;
        }

        &-close{
            display: flex;
            align-items: center;
            padding: 2px;
            border-radius: 2px;

            &:hover{
                background: #eeeeee;
            }
        }
    }

</style>
<style lang="scss">
    .el-date-table td.end-date .el-date-table-cell__text, .el-date-table td.start-date .el-date-table-cell__text{
        background: $purple;
    }
    .el-cascader-node.in-active-path, .el-cascader-node.is-active, .el-cascader-node.is-selectable.in-checked-path{
        color: $purple;
    }
    .el-date-table td.today .el-date-table-cell__text{
        color: $purple;
    }
    .el-date-table td.available:hover{
        color: $purple;
    }
</style>