<template>
    <div class="container-catalog">
        <div class="unselectable container-catalog-title" @click="handleShowCatalog('self')">
            <div class="flex align-center">
                <div class="arrowRight mr6">
                    <el-icon :size="16" :class="!showSelfCollection ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'" color="#6F7A93"><CaretRight/></el-icon>
                </div>
                <svgFont class="font-16" color="#6F7A93" icon="books"></svgFont>
                <span class="ml10 pt2">笔记本</span>
            </div>
            <svgFont class="add-btn" color="#6F7A93" icon="plus" @click.stop="showAddProject = true"></svgFont>
        </div>
        <FCollapse>
            <div class="project-list" v-show="showSelfCollection">
                <collectionItem
                        type="self"
                        ref="collectionItemRef"
                        @editCollection="editCollection"
                        @knowledgeGraph="knowledgeGraph"
                        @basics="basics"
                        @removeCollection="removeCollection"
                ></collectionItem>
            </div>
        </FCollapse>
        <div class="unselectable container-catalog-title" @click="handleShowCatalog('team')">
            <div class="flex align-center">
                <div class="arrowRight mr6">
                    <el-icon :size="16" :class="!showTeamCollection ? 'is_rotate_arrow_back' : 'is_rotate_arrow_go'" color="#6F7A93"><CaretRight/></el-icon>
                </div>
                <svgFont class="font-16" color="#6F7A93" icon="shareBooks"></svgFont>
                <span class="ml10 pt2">共享笔记本</span>
            </div>
        </div>
        <FCollapse>
            <div class="project-list" v-show="showTeamCollection">
                <collectionItem
                        type="team"
                        ref="collectionItemRef"
                        @editCollection="editCollection"
                        @knowledgeGraph="knowledgeGraph"
                        @basics="basics"
                        @removeCollection="removeCollection"
                ></collectionItem>
            </div>
        </FCollapse>
    </div>

    <!-- 添加/编辑项目 -->
    <el-dialog :title="projectTitle" v-model="showAddProject" width="350px" destroy-on-close @close="showEmoji = false">
        <el-form ref="projectFormRef" :model="project.form" :rules="project.rules" label-width="100" v-loading="projectLoad">
            <el-form-item label="" prop="collection">
                <div style="padding: 10px 10px 0 10px;">
                    <div class="input-box">
                        <div class="input-emoji">
                            <el-popover placement="right-start" :width="344" trigger="click" :visible="showEmoji">
                                <VuemojiPicker @emojiClick="handleEmojiClick" :isDark="false" />
                                <template #reference>
                                    <el-button type="text" size="medium" @click="showEmoji = true">
                                        <span style="font-size: 24px;">😀</span>
                                    </el-button>
                                </template>
                            </el-popover>
                        </div>
                        <input v-model="project.form.collection"
                               ref="collectionRef"
                               autocomplete="off"
                               size="small"
                               placeholder="请输入笔记本名称"
                               class="ml4 collection-input"
                        />
                    </div>
                    <div class="color-box mt20">
                        <div v-for="item in predefineColors" :key="item"
                             :style="{background: item}"
                             :class="[project.form.color == item ? 'defaultColor' : '']"
                             class="color-block mr10"
                             @click="project.form.color = item"
                        ></div>
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <template v-if="isEdit && false">
            <div class="my-team">
                <div>我的共享 <a target="_blank" href="https://help.fangcun.in/help/team.html">使用说明</a></div>
                <span @click="isDeleteTeam = !isDeleteTeam">{{!isDeleteTeam ? '编辑' : '取消'}}</span>
            </div>
            <div class="team">
                <template v-for="(member,i) in collectionParams.members" :key="member.id">
                    <el-tooltip
                            effect="dark"
                            :content="member.name"
                            placement="bottom"
                    >
                        <div class="team-header">
                            <template v-if="member.is_self != 1">
                                <el-popconfirm
                                        title="确认移除成员吗？"
                                        confirm-button-text="确认"
                                        cancel-button-text="取消"
                                        confirmButtonType="text"
                                        :icon="InfoFilled"
                                        icon-color="#b22222"
                                        @confirm="shiftTeamCollection(member.id, i)"
                                >
                                    <template #reference>
                                        <el-icon v-show="isDeleteTeam" class="delete-header"><remove-filled /></el-icon>
                                    </template>
                                </el-popconfirm>
                            </template>
                            <img :src="member.avatar" alt="">
                        </div>
                    </el-tooltip>
                </template>
                <el-button v-if="collectionParams.is_self == 1" :icon="Plus" size="large" circle @click="inviteTeam"></el-button>
            </div>
            <div class="team-footer" v-if="collectionParams.is_self != 1">
                <el-popconfirm
                        title="离开团队后，你在团队的笔记就会失去，确定离开吗？"
                        confirm-button-text="确认"
                        cancel-button-text="取消"
                        confirmButtonType="text"
                        :icon="InfoFilled"
                        icon-color="#b22222"
                        @confirm="signOutApiCollection(); showAddProject = false"
                >
                    <template #reference>
                        <el-button type="text" size="small" style="color:#b22222;">退出团队笔记本</el-button>
                    </template>
                </el-popconfirm>
            </div>
            <el-dialog
                    v-model="inviteData.show"
                    width="300px"
                    title="邀请"
                    append-to-body
            >
                <p style="color: #999;font-size: 14px;text-align: center;">邀请扫码，加入团队笔记本</p>
                <img :src="inviteData.qr_code" alt="二维码" style="width: 100%;">
            </el-dialog>
        </template>


        <template #footer>
            <span class="dialog-footer">
                <el-button class="color-white" color="#aaaaaa" @click="showAddProject = false">取 消</el-button>
                <el-button class="color-white" color="#7885d1" type="primary" @click="sureMession">确 定</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 同步到Notion -->
    <el-dialog
            title="同步"
            v-model="showBasicsGraph"
            destroy-on-close
            width="380px"
    >
        <div class="sync-database" v-loading="notionBasicsLoading">
            <div>
                <el-select size="small" v-model="database" placeholder="请选择database进行同步" style="width: 220px;" class="mr10">
                    <el-option v-for="(data,index) in databaseList" :key="index"
                               :label="data.name"
                               :value="data.id"></el-option>
                </el-select>
                <el-button size="small" type="primary"
                           :disabled="!!syncAct"
                           @click="bindNotionDatabase">{{syncAct ? '已同步' : '立即绑定'}}</el-button>
            </div>
            <p style="color:#999; font-size:12px">* 绑定notion后，如果笔记量比较大，可能会出现更新比较慢的情况请耐心等待。绑定后，你在方寸笔迹新增的笔记也会保持同步到notion中。详见<a href="https://help.fangcun.in/help/notion.html" target="_blank">Notion帮助</a >。</p>
        </div>
    </el-dialog>

    <!-- 删除collection操作 -->
    <el-dialog title="提示" v-model="showRemoveCollection" width="400px" destroy-on-close>
        <div class="remove-collection-box pt10 pb10 pl10 pr10">
            <p class="mb6 color-3 font-16">我们发现您的笔记本下存在宝贵的笔记！</p>
            <div class="flex align-center mb10">
                <p class="color-9">将它转移到其他的笔记本？</p>
                <el-switch
                        v-model="showMoveSelect"
                        inline-prompt
                        active-text="是"
                        inactive-text="否"
                />
            </div>
            <el-select v-show="showMoveSelect" v-model="moveCollectionId" filterable placeholder="请选择笔记本" clearable>
                <el-option
                        v-for="item in canTransferProjectList"
                        :key="item.id"
                        :label="item.collection"
                        :value="item.id"
                >
                </el-option>
            </el-select>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button class="color-white" color="#aaaaaa" @click="showRemoveCollection = false">取 消</el-button>
                <el-button class="color-white" color="#7885d1" type="primary" @click="sureRemoveCollection">确 定</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 知识图谱 -->
    <div class="knowledge">
        <el-dialog
                v-model="showKnowledgeGraph"
                :fullscreen="true"
                center
                @close="closeEcharts"
        >
            <div id="myChart"></div>
        </el-dialog>
    </div>

    <mask-com v-if="showEmoji" :opacity="0" :zIndex="2000" @click="showEmoji = false"></mask-com>
</template>

<script setup>
    import {ref, reactive, unref, onMounted, computed, defineAsyncComponent} from "vue";
    import { useStore } from "vuex";
    import bus from '@/utils/bus';
    import { setGoalApi } from "@/api/user"
    // hooks
    import { getGraph, closeEcharts } from "./js/echart"
    import { showBasicsGraph, notionBasicsLoading, database, syncAct, databaseList, bindNotionDatabase, basics } from "./js/syncNotion"
    import { isDeleteTeam, collectionParams, inviteData, shiftTeamCollection, signOutApiCollection, inviteTeam } from "./js/team"
    import handleFileOperation from '../HomeNotes/js/handleFile'
    // 组件
    import { ElNotification } from "element-plus"
    import { Plus, InfoFilled, CaretRight } from "@element-plus/icons-vue"
    import { VuemojiPicker } from 'vuemoji-picker'
    import collectionItem from './components/collectionItem'
    import FCollapse from '@/components/FCollapse'
    // 异步组件
    const maskCom = defineAsyncComponent(() => import('@/components/mask'))

    // service
    const collectionService = require('service/action/collection.js')
    const store = useStore();

    // ref
    const collectionItemRef = ref(null)


    // 获取个人笔记本项目
    let projectListSelf = computed(() => store.state.collection.projectListSelf)
    // 获取团队笔记本项目
    // let projectListTeam = computed(() => store.state.collection.projectListTeam)
    // 笔记的本的选中的索引值
    // let collectionActived = computed(() => store.state.notes.classifyObj.collectionActived)

    // 控制笔记本分类的是否展开的状态
    const showSelfCollection = computed(() => store.state.notes.catalogState.showSelfCollection)
    const showTeamCollection = computed(() => store.state.notes.catalogState.showTeamCollection)
    function handleShowCatalog(type){
        store.commit('notes/CHANGE_CATALOG_STATE', {
            showSelfCollection: type === 'self' ? !showSelfCollection.value : showSelfCollection.value,
            showTeamCollection: type === 'team' ? !showTeamCollection.value : showTeamCollection.value
        })
    }

    // 获取默认collection的笔记
    function handleWriteNote(item){
        handleFileOperation.createFolder(item).then((res) => {
            if(res.status === 'success'){
                store.commit('notes/SET_WRITE_NOTE_FILE', res.data)
            }
        })
    }

    // 添加笔记方法
    let showAddProject = ref(false);
    let projectFormRef = ref(null);
    let isEdit = ref(false);  // 判断是否是修改状态
    let projectTitle = ref("新建笔记本");
    let projectLoad = ref(false);
    let project = reactive({
        form: {
            collection_id: "",
            collection: '',
            color: "#F58220"
        },
        rules: {
            collection: [
                { required: true, message: '请输入笔记本名称', trigger: 'blur' }
            ]
        },
    })

    // 默认颜色
    let predefineColors = [ '#F58220', '#7FB80E', '#585EAA', '#AA2116', '#FFC20E', '#00AE9D', '#33A3DC', '#f2EADA', '#563624' ];
    function changeColor(e){
        project.form.color = e;
    }

    // emoij 选择器
    let showEmoji = ref(false);
    let collectionRef = ref(null);
    function handleEmojiClick(detail) {
        showEmoji.value = false;
        let startText = project.form.collection.substring(0,collectionRef.value.selectionStart);
        let endText = project.form.collection.substring(collectionRef.value.selectionStart, project.form.collection.length);
        project.form.collection = `${startText}${detail.emoji.unicode}${endText}`;
    }

    bus.on('ADD_COLLECTION', () => {
        addCollection()
    })
    // 添加笔记本
    function addCollection(){
        showAddProject.value = true;
        isEdit.value = false;
        projectTitle.value = "新建笔记本";

        project.form.collection_id = "";
        project.form.collection = "";
        project.form.color = "#F58220";
    }

    // 编辑笔记本
    async function editCollection({item, index}){
        isEdit.value = true;
        projectTitle.value = "修改笔记本"
        showAddProject.value = true;

        project.form.collection_id = item.id;
        project.form.collection = item.collection;
        project.form.color = item.color;

        collectionParams.value = item
    }

    // 删除collection
    let showRemoveCollection = ref(false);
    let checkedCollectionId = '';
    let defaultCollection = computed(() => { return store.state.user.userSetting.default });
    let canTransferProjectList = ref([])
    let showMoveSelect = ref(false)
    let moveCollectionId = ref(null)
    async function removeCollection({item, index}){
        checkedCollectionId = item.id;
        let res = await store.dispatch("collection/removeCollection", {
            collection_id: item.id,
            operate: '',
            dest_collection_id: ''
        })
        canTransferProjectList.value = projectListSelf.value.filter((proj) => {
            return proj.id !== item.id
        })
        if(res.status_code === 501 && res.data.note_count > 0){
            showRemoveCollection.value = true;
            showMoveSelect.value = false
            moveCollectionId.value = null
        }
        if(res.status_code === 200){
            removeCollectionCallback(item.id)

            ElNotification({
                message: '删除成功',
                type: 'success'
            });
        }
    }
    async function sureRemoveCollection(){
        let res = null
        if(showMoveSelect.value){
            if(!moveCollectionId.value){
                ElNotification.warning('请选择要转移的笔记本')
                return false
            }
            res = await store.dispatch("collection/moveCollectionNotes", {
                source_id: checkedCollectionId,
                target_id: moveCollectionId.value
            })
        }else{
            res = await store.dispatch("collection/clearCollectionNotes", {
                collection_id: checkedCollectionId
            })
        }

        if(res.status_code === 200){
            showRemoveCollection.value = false;
            removeCollectionCallback(checkedCollectionId)

            if(showMoveSelect.value && moveCollectionId.value){
                ElNotification({
                    message: '转移成功',
                    type: 'success'
                });
            }else{
                ElNotification({
                    message: '删除成功',
                    type: 'success'
                });
            }
        }
    }
    // 删除笔记本的回调
    function removeCollectionCallback(checkedCollectionId){
        // store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
        //     collectionTitle: catalogList.value[0].title,
        //     index: 0,
        //     id: catalogList.value[0].id
        // })

        store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
            collection_id: catalogList.value[0].id,
            tag_id: '',
            group_id: ''
        })
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            collectionTitle: catalogList.value[0].title,
            collectionActive: catalogList.value[0].id,
            trashActive: '',
            tagActive: '',
            tagTitle: '',
            tagGroupTitle: ''
        })

        store.dispatch("notes/getTagsList");
        store.commit("notes/RECORD_COLLECTION",{
            checked_collection: projectListSelf.value[0].collection,
            collection_id: projectListSelf.value[0].id
        });
        bus.emit("CLEAR_KAYWORD");

        // 判断删除的是不是默认笔记
        if(checkedCollectionId === defaultCollection.value){
            // setDefaultCollection()
        }
    }
    // 设置默认笔记
    function setDefaultCollection(){
        setGoalApi({
            collection_id: projectListSelf.value[0].id
        }).then((res) => {
            if(res.code === 200){
                store.dispatch("user/getUserSetting")
            }
        })
    };

    // 确认修改
    function sureMession(){
        const form = unref(projectFormRef);
        form.validate(async (valid) => {
            if(!valid) return false;
            projectLoad.value = true;
            if(isEdit.value){
                store.dispatch("collection/editCollection",{
                    collection_id: project.form.collection_id,
                    collection: project.form.collection,
                    color: project.form.color
                }).then((res) => {
                    projectLoad.value = false
                    if(res) showAddProject.value = false
                })
            }else{
                store.dispatch("collection/addCollection",{
                    collection: project.form.collection,
                    color: project.form.color
                }).then((res) => {
                    console.log(res)
                    projectLoad.value = false;
                    if(res.data){
                        showAddProject.value = false;
                        let data = {
                            collection: res.data.collection,
                            id: res.data.collection_id
                        }
                        collectionItemRef.value.clickProject(data, projectListSelf.value.length - 1)
                    }
                })
            }
        });
    }

    // 展示知识图谱
    let showKnowledgeGraph = ref(false)
    async function knowledgeGraph({item, index}){
        const user_id = store.state.user.userInfo.id
        getGraph(user_id, item, showKnowledgeGraph);
    }

    onMounted( async () => {
        // store.dispatch("target/getCollection", { use_group: "team" });
        await store.dispatch("collection/getCollection", { user_id: store.state.user.userInfo.id, page: 1, size: 100 });

        // store.dispatch("user/getUserSetting");
        store.dispatch("user/getUserBase");
        // store.dispatch("user/getUserInfo");

        // if(store.state.notes.classifyObj.collectionTitle) {
        //     let data = { collection: store.state.notes.classifyObj.collectionTitle }
        //     handleWriteNote(data)
        // }
    })
</script>

<style lang="scss">
    .el-dialog__body{
        padding: 4px 14px !important;
    }
    .input-emoji{
        .el-button--text{
            padding: 0 !important;
        }
    }
    .knowledge .el-dialog__header{
        padding: 0 !important;
        border: 0px !important;
    }
    .knowledge{
        #myChart{
            width: 96vw;
            height: calc( 96vh - 40px);
            margin: 40px auto 10px;
        }
    }

    .collection-chosen{
        transform: scale(1.1, 1.1);
        transition: transform 0.2s;
    }
    .collection-ghost{
        transform: scale(1, 1);
    }
    .remove-collection-box{
        .el-switch.is-checked .el-switch__core{
            background: $purple !important;
            border-color: $purple !important;
        }
    }
    .container-catalog{
        .el-collapse{
            border: 0;
        }
        .el-collapse-item__wrap{
            background: none !important;
            border: 0;
        }
        .el-collapse-item__content{
            padding-bottom: 0;
        }
        .el-collapse-item__header{
            background: none;
            border: 0px;
            height: 36px;
        }
    }
</style>
<style lang="scss" scoped>
    .container-catalog{
        .project-list{
            padding: 0 10px 0 32px;
            overflow: hidden;
        }
        .catalog-title{
            height: 32px;
            display: flex;
            align-items: center;
            cursor: pointer;
            border-radius: 4px;
            &:hover{
                background: #f5f5f5;
                span{
                    color: #666;
                }
            }
            span{
                color: #9EA0AD;
                font-size: 14px;
                margin-left: 10px;
            }
            .number{
                display: inline-block;
                width: 32px;
                text-align: center;
                font-size: 12px;
                line-height: 28px;
            }
        }
        .actived-style{
            span{
                color: $purple !important;
                font-weight: 700;
            }
        }

        .container-catalog-title{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 10px;
            margin-bottom: 4px;
            border-radius: 4px;
            cursor: pointer;
            &:hover{
                background: #eeeeee;
                .add-btn{
                    opacity: 1;
                }
            }
            span{
                font-size: 14px;
                color: #6F7A93;
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
    }
    .default-catalog{
        padding: 10px 12px;
    }

    .input-box{
        display: flex;
        align-items: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        height: 34px;
        line-height: 34px;
        .input-emoji{
            width: 40px;
            height: 34px;
            text-align: center;
            background: #f5f5f5;
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
            border-right: 1px solid #ccc;
        }
        .collection-input{
            width: 240px;
            padding-left: 4px;
            font-size: 14px;
            color: #333;
            outline: none;
            border: 0;
        }
    }
    .color-box{
        display: flex;
        align-items: center;
        .color-block{
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #fff;
        }
        .defaultColor{
            box-shadow: 0px 0px 10px -4px rgba($color: #000000, $alpha: 1);
            border: 2px solid #fff!important;
        }
    }
    // 团队头像
    .my-team{
        display: flex;
        align-items: center;
        justify-content: space-between;
        >div{
            color: #333333;
            font-size: 14px;
            font-weight: 700;
        }
        a{
            display: inline-block;
            color: #999999;
            font-size: 12px;
            font-weight: 500;
        }
        span{
            font-size: 12px;
            color: #999;
            cursor: pointer;
            &:hover{
                color: $purple;
            }
        }
    }
    .team{
        display: flex;
        align-items: center;
        background: #f9f9f9;
        margin: 10px 0;
        border-radius: 4px;
        .team-header{
            position: relative;
            .delete-header{
                position: absolute;
                top: 0;
                right: 0;
                color: $error;
                font-size: 18px;
                cursor: pointer;
            }
            > img{
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin: 5px 10px;
            }
        }
    }
    .team-footer{
        text-align: right;
        padding-bottom: 10px;
    }

    // 同步到notion
    .sync-database{
        >div{
            padding: 20px 20px 0;
        }
        p{
            color: #999;
            font-size: 12px;
            padding: 10px 20px;
        }
        a{
            color: $purple;
        }
    }


</style>