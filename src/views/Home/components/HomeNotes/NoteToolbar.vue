<template>
    <div class="header-toolbar">
        <div class="filter flex">
            <el-input
                    placeholder="搜索笔记..."
                    :prefix-icon="Search"
                    clearable
                    v-model="keyword"
                    @change="inputSearch"
                    style="width: 230px"
            >
                <template #append>
                    <el-popover
                            :visible="showSeniorSearch"
                            placement="bottom"
                            :width="256"
                            :hide-after="0"
                            :show-arrow="false"
                            trigger="click"
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
                                        style="width: 210px"
                                />
                            </div>
                            <div class="flex justify-end">
                                <el-button plain color="#999999" size="small" @click="showSeniorSearch = false">取消</el-button>
                                <el-button color="#6C56F6" size="small" @click="inputSearch">确定</el-button>
                            </div>
                        </div>
                        <template #reference>
                            <el-button :icon="Operation" @click="showSeniorSearch = !showSeniorSearch"></el-button>
                        </template>
                    </el-popover>
                </template>
            </el-input>
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
    import {computed, defineAsyncComponent, ref, watch, onBeforeUnmount} from "vue"
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // hooks
    // 组件
    import { Search, Switch, Operation } from '@element-plus/icons-vue'
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
    const catalogMarginLeft = computed(() => process.platform === 'darwin' ? '70px' : '10px')
    let userInfo = computed(() => store.state.user.userInfo)
    let noteTypeActive = computed(() => store.state.notes.catalogActiveState.noteTypeActive)

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
        setTimeout(() => {
            store.dispatch("notes/getTagsList")
            if(isTrash){
                store.dispatch('notes/getGroupTrashInitial')
            }else{
                store.dispatch('notes/getGroupInitial')
            }
        })
    }

    // 搜索方法
    let keyword = ref('')
    let dateValue = ref('')
    let showSeniorSearch = ref(false)
    function inputSearch(){
        bus.emit('handleSearchNote',{
            keyword: keyword.value,
            start_time: dateValue.value ? dateValue.value[0] : undefined,
            end_time: dateValue.value ? dateValue.value[1] : undefined
        })
        showSeniorSearch.value = false
    }
    bus.on('clearFilterValue', () => {
        dateValue.value = ""
        keyword.value = ""
    })

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
            margin-right: 10px;
        }
        .header-toolbar-options{
            height: 32px;
        }

    }

    .btn-hover:hover{
        background: #cccccc;
        color: $purple;
    }
</style>