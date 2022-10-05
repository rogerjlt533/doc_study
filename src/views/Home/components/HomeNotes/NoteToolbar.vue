<template>
    <div class="header-toolbar">
        <div class="filter flex">
            <div
                    class="fold-icon mr20"
                    v-show="!showCatalog"
                    :style="{ marginLeft: !showCatalog ? catalogMarginLeft : '0' }"
            >
                <font-awesome-icon class="icon-angles-left" icon="angles-left" @click="handleShowCatalog" />
            </div>
            <el-input
                    placeholder="搜索笔记..."
                    :prefix-icon="Search"
                    clearable
                    v-model="keyword"
                    @change="inputSearch"
                    style="width: 230px"
            >
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
    import {computed, defineAsyncComponent, ref} from "vue"
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // 组件
    import { Search, Switch } from '@element-plus/icons-vue'
    const userMenu = defineAsyncComponent(() => import('./components/userMenu.vue'))
    // hooks
    import { showCatalog, handleShowCatalog } from '../HomeSidebar/js/controlShowCatalog'

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


    // 切换写作模式
    let writeTypeText = ref('写作模式')
    function changeWriteModel(){
        emit('switch')
        writeTypeText.value = !props.isWrite ? '卡片速记' : '写作模式'
    }

    // 搜索方法
    let keyword = ref('')
    function inputSearch(){
        bus.emit('INPUT_SEARCH',{
            keyword: keyword.value
        })
    }

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