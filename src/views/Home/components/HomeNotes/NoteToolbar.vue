<template>
    <div class="header-toolbar">
        <div class="filter">
            <el-input
                    placeholder="搜索笔记..."
                    :prefix-icon="Search"
                    clearable
                    v-model="keyword"
                    @change="inputSearch">
            </el-input>
        </div>
        <div class="header-toolbar-options flex">
            <!--<div-->
            <!--    class="fold-icon"-->
            <!--    :style="{ marginLeft: !showCatalog ? catalogMarginLeft : '0' }"-->
            <!--&gt;-->
            <!--    <font-awesome-icon v-show="!showCatalog" class="icon-angles-left" icon="angles-left" @click="handleShowCatalog" />-->
            <!--</div>-->
            <!--<div class='change-write unselectable' @click="changeWriteModel">-->
            <!--    <svgFont class="icon-expand" icon="switch"></svgFont>-->
            <!--    <p>{{writeTypeText}}</p>-->
            <!--</div>-->
            <el-button color="#6C56F6" :icon="Switch" round @click="changeWriteModel">{{writeTypeText}}</el-button>
            <div class="options flex">
                <el-button color="#eeeeee" class="btn-hover ml12" circle>
                    <font-awesome-icon class="option-btn" icon="tags"></font-awesome-icon>
                </el-button>
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

                <!--<el-button color="#eeeeee" class="btn-hover ml12" circle>-->
                <!--    <font-awesome-icon class="option-btn" icon="gear"></font-awesome-icon>-->
                <!--</el-button>-->

                <!--<div class="option">-->
                <!--    -->
                <!--</div>-->
                <!--<div class="option">-->
                <!--    <font-awesome-icon class="option-btn" icon="trash-alt"></font-awesome-icon>-->
                <!--</div>-->
                <!--<div class="option">-->
                <!--    <font-awesome-icon class="option-btn" icon="gear"></font-awesome-icon>-->
                <!--</div>-->
            </div>
        </div>



        <!--<div class="write-info" v-show="isWrite">-->
        <!--    <p>字数统计：{{writeInfo.size_count}}</p>-->
        <!--    <p>创建时间：{{writeInfo.create_time}}</p>-->
        <!--    <p>上次修改：{{writeInfo.update_time}}</p>-->
        <!--</div>-->
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
    // import { showCatalog, handleShowCatalog } from '../HomeSidebar/js/controlShowCatalog'
    // import { writeInfo } from './js/writeEditor.js'

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
    // const catalogMarginLeft = computed(() => process.platform === 'darwin' ? '70px' : '10px')
    let userInfo = computed(() => store.state.user.userInfo)


    // 切换写作模式
    let writeTypeText = ref('写作笔记')
    function changeWriteModel(){
        emit('switch')
        writeTypeText.value = !props.isWrite ? '卡片速记' : '写作笔记'
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
                transform: rotate(180deg);
            }
        }
        .filter{
            width: 230px;
            margin-right: 10px;
        }
        .header-toolbar-options{
            height: 32px;
        }
        .write-info{
            display: flex;
            align-items: center;
            p{
                font-size: 12px;
                color: #999999;
                margin-right: 20px;
            }
        }

        .change-write{
            display: flex;
            align-items: center;
            color: #eeeeee;
            font-size: 12px;
            padding: 5px 16px;
            border-radius: 28px;
            background: $purple;
            transition: all 0.3s;
            .icon-expand{
                margin-right: 4px;
                font-size: 16px;
            }
        }
        //.options{
        //    .option{
        //        height: 28px;
        //        &:hover{
        //            .option-btn{
        //                background: #cccccc;
        //                color: $purple;
        //            }
        //        }
        //        .option-btn{
        //            border-radius: 50%;
        //            background: #eeeeee;
        //            padding: 10px;
        //            font-size: 12px;
        //            margin-left: 16px;
        //            color: #6F7A93;
        //        }
        //    }
        //}
    }

    .btn-hover:hover{
        background: #cccccc;
        color: $purple;
    }
</style>