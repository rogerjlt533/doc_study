<template>
    <div @contextmenu="handleRightClick" >
        <div class="line-one" draggable="true">
            <div class="flex align-center">
                <font-awesome-icon icon="grip-vertical" color="#6D7785" class="font-12 mr6" />
                <el-tooltip
                        v-if="item.is_self === 2"
                        effect="dark"
                        :content="item.author"
                        placement="bottom"
                >
                    <el-image
                            class="header-avatar"
                            :src="item.avatar"
                            fit="cover"
                            :lazy="true"
                    ></el-image>
                </el-tooltip>
                <span class="time">{{item.updated_time}}</span>
            </div>
            <div class="right">
                <div class="collect">
                    <el-dropdown size="small" trigger="click" max-height="236px" v-if="item.is_self === 1">
                        <div>
                            <span class="color" :style="{ background: item.collection.color }"></span>
                            <span class="name">{{item.collection.collection}}</span>
                            <font-awesome-icon v-show="item.collection.is_team === 1" icon="user-friends" class="mr6" style="font-size: 12px;" color="#9EA0AD" />
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                        :class="[collect.id === item.collection_id ? 'actived' : '']"
                                        v-for="(collect,index) in collectionListSelf" :key="index"
                                        @click="resetCollection(collect,index)">
                                    {{collect.collection}}
                                </el-dropdown-item>
                                <el-divider v-if="collectionListSelf.length && collectionListTeam.length" style="margin: 4px 0"></el-divider>
                                <el-dropdown-item
                                        :class="[collect.id === item.collection_id ? 'actived' : '']"
                                        v-for="(collect,index) in collectionListTeam" :key="index"
                                        @click="resetCollection(collect,index)">
                                    {{collect.collection}}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <div v-else>
                        <span class="color" :style="{ background: item.collection.color }"></span>
                        <span class="name">{{item.collection.collection}}</span>
                        <font-awesome-icon v-show="item.collection.is_team == 1" icon="user-friends" class="mr6" style="font-size: 12px;" color="#9EA0AD" />
                    </div>
                </div>
            </div>
        </div>
        <div
                ref="htmlRef" class="line-two"
                :class="[ isOverHeight > 200 && !isFlod ? 'max-height' : '']"
        >
            <div class="content-html" v-html="item.note" @click="getNoteNodeClick" @dblclick="dblclickNote"></div>
            <div class="resource-url" v-if="item.url" @click="openUrlByBrowser(item.url)">
                <div>
                    <span>来源网站</span>
                    <font-awesome-icon class="font-icon" icon="caret-right" color="#7885d1" />
                </div>
            </div>
        </div>
        <span class="flod ml10" v-if="isOverHeight > 200" @click="isFlod = !isFlod">
            {{!isFlod ? "展开" : "收起"}}
        </span>

        <!-- 历史笔记 -->
        <el-drawer
                title="笔记历史"
                v-model="showNoteHistory"
                size="40%"
                with-header="false"
                direction="rtl"
                destroy-on-close
                custom-class="note-drawer"
        >
            <div class="note-history">
                <el-scrollbar height="86vh" v-if="notesHistoryList.length">
                    <el-timeline>
                        <template v-for="history in notesHistoryList" :key="history.id">
                            <el-timeline-item :timestamp="history.edit_time" placement="top">
                                <div class="recovery">
                                    <el-button class="recovery-btn" @click="recoveryHistoryNote(history)" :icon="RefreshLeft" size="small" type="text" color="#7885d1">笔记恢复</el-button>
                                </div>
                                <el-card shadow="hover">
                                    <div class="content-html" v-html="history?.former_note"></div>
                                </el-card>
                            </el-timeline-item>
                        </template>
                    </el-timeline>
                </el-scrollbar>
                <el-empty v-else description="崭新的笔记，没有历史记录~"></el-empty>
            </div>
        </el-drawer>
    </div>
</template>

<script setup>
    import {ref, defineProps, onMounted, defineEmits, watch, computed, nextTick} from "vue";
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    import { getNotesHistoryApi, rollHistoryApi } from '@/apiDesktop/notes'
    // 组件 ----
    import previewImg from "@/components/imagePreview"
    import NoteAnnotation from "./NoteAnnotation.vue";
    import { ElMessageBox, ElNotification } from "element-plus"
    import { RefreshLeft, Loading } from '@element-plus/icons-vue'
    // hooks ----
    import { simpleEditor } from "../js/editor"
    import { handleContentHtml, handleHtmlTagSpace } from '@/assets/js/processHtml'
    import openUrlByBrowser from "@/assets/js/openUrlByBrowser";
    import { getNoteNodeClick } from '../js/editorMethods'
    import { removeHtmlTag } from '@/utils/tools'
    import fcDialog from "@/components/dialog";

    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;

    const store = useStore();
    const emit = defineEmits(['deleteNote']);
    const matchReg = /\#(\S+?)?\s{1}/g

    const props = defineProps({
        item: {
            type: Object,
            default: {}
        },
        index: {
            type: Number
        },
        isTrash: {
            default: ""
        }
    });

    // 右击笔记本
    const handleRightClick = () => {
        let menu = new Menu()
        if(props.isTrash){
            menu.append(new MenuItem({ label: '🗂 恢复笔记', click: recoverNote }))
            menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({ label: '🗑 删除笔记', click: deleteNote }))
        }else{
            menu.append(new MenuItem({ label: '📝 编辑', click: editNote }))
            menu.append(new MenuItem({ label: '💬 引用', click: annotation }))
            menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
            // menu.append(new MenuItem({ label: '📅 笔记历史', click: getNoteHistory }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({ label: '🗑 扔到废纸篓', click: moveTrashCan }))
        }
        menu.popup()
    }

    // 重置collection列表
    let collectionListSelf = ref(store.state.collection.projectListSelf);
    let collectionListTeam = ref(store.state.collection.projectListTeam);
    async function resetCollection(collection){
        if(collection.id === props.item.collection_id) return false

        const editor = simpleEditor(props.item.note)
        const contentJson = editor.getJSON()
        const editorHtml = handleHtmlTagSpace(editor.getHTML())
        const tag_list = editorHtml.match(matchReg) ? editorHtml.match(matchReg).map(item => item.substr(1).trim()) : []
        const contentHtml = handleContentHtml(editor.getHTML())

        const res = await store.dispatch("notes/editNote",{
            contentHtml,
            contentJson,
            collection_id: collection.id,
            noteId: props.item.id,
            tag_list,
            postil_list: props.item.quote.map(item => item.id),
            index: props.index
        })
        if(res.status_code === 200){
            editor.commands.clearContent()
            props.item.collection.color = res.data.collection.color
            props.item.collection.collection = res.data.collection.collection
            props.item.collection_id = res.data.collection_id
        }
    }

    // 删除该笔记
    function moveTrashCan(){
        fcDialog({
            title: '提示',
            message: "确定将这条笔记扔到废纸篓吗?",
        }).then(() => {
            emit("deleteNote")
            store.dispatch("notes/removeNote",{
                id: props.item.id,
                index: props.index,
                note_type: 1
            })
            store.dispatch("user/getUserBase")
        }).catch(()=>{})
    }

    // 引用笔记
    function annotation(){
        bus.emit("SET_ANNOTATION_ID", {
            item: props.item,
            isOverHeight: isOverHeight.value
        })
    }

    // 编辑笔记
    function editNote(){
        setTimeout(() => {
            props.item.ifEditCon = true;
        }, 150)
    }
    // 双击编辑笔记
    function dblclickNote(){
        if(props.isTrash || props.item.is_self !== 1) return false;
        editNote(props.item);
    }

    // 回收站恢复笔记
    function recoverNote(){
        store.dispatch("notes/recoverNote",{
            note_id: props.item.id,
            index: props.index,
            note_type: 1
        })
        store.dispatch("user/getUserBase");
    }
    // 回收站删除笔记
    function deleteNote(){
        emit("deleteNote")
        store.dispatch("notes/deleteNote",{
            note_id: props.item.id,
            index: props.index,
            note_type: 1
        })
        store.dispatch("user/getUserBase");
    }

    // 获取笔记历史
    let showNoteHistory = ref(false);
    let notesHistoryList = ref([]);
    let noteHistory = {};
    async function getNoteHistory(){
        noteHistory.id = props.item.id;
        const data = {
            user_id: store.state.user.userInfo.id,
            note_id: props.item.id,
            page: 1,
            size: 50
        }
        const res = await getNotesHistoryApi(data)
        console.log('noteAction.history', res)
        if(res.status_code === 200){
            showNoteHistory.value = true;
            notesHistoryList.value = res.data.histories
        }
    }
    // 恢复历史笔记
    async function recoveryHistoryNote(item){
        noteHistory.note = item.former_note;
        const res = await rollHistoryApi({
            user_id: store.state.user.userInfo.id,
            history_id: item.id
        })
        if(res.status_code === 200){
            ElNotification({
                message: '笔记已恢复！',
                type: 'success'
            });
            store.commit("notes/RECOVERY_HISTORY", noteHistory)
        }
    }

    //判断内容高度
    let isOverHeight = ref(0);
    let isFlod = ref(false);
    let htmlRef = ref(null);
    let ifSetFlod = computed(() => { return store.state.user.userSetting.fold_note });
    onMounted(() => {
        if(ifSetFlod.value == 1){
            setTimeout(() => {
                if(htmlRef.value){
                    isOverHeight.value = htmlRef.value.offsetHeight;
                }
            }, 100)
        }
    })
</script>

<style lang="scss">
    .note-drawer{
        background: #f5f5f5;
    }
</style>
<style lang="scss" scoped>
    .line-one{
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px 4px;
        .header-avatar{
            width: 24px;
            height: 24px;
            border-radius: 6px;
            margin-right: 4px;
        }
        .time{
            color: #6D7785;
            font-size: 14px;
            margin-right: 10px;
        }
        svg{
            cursor: move;
        }
        .right{
            display: flex;
            align-items: center;
            .collect{
                cursor: pointer;
                margin-right: 10px;
                .color{
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 6px;
                }
                .name{
                    display: inline-block;
                    color: #999;
                    font-size: 12px;
                    line-height: 30px;
                    margin-right: 4px;
                    &:hover{
                        color: $purple;
                    }
                }
            }
            .options-list{
                list-style: none;
            }
        }
    }
    .line-two{
        font-size: 14px;
        color: #333;
        padding: 0 16px;
        .resource-url{
            display: block;
            width: 80px;
            text-decoration: none;
            cursor: pointer;
            >div{
                display: flex;
                align-items: center;
                color: $purple;
                font-size: 12px;
            }
        }
    }
    .max-height{
        max-height: 220px;
        overflow: hidden;
    }
    .trigger-style{
        &:hover{
            box-shadow: 0px 1px 4px -2px rgba($color: #000000, $alpha: 0.5);
        }
        &:active{
            box-shadow: 0px 0px 4px -3px rgba($color: #000000, $alpha: 0.5);
        }
    }

    .note-history{
        padding-bottom: 20px;
        .recovery{
            text-align: right;
            .recovery-btn{
                color: #999;
                font-size: 12px;
                &:hover{
                    color: $purple;
                }
            }
        }
        .notes{
            background: #fff;
            border-radius: 4px;
            border: 1px solid #eeeeee;
            margin-bottom: 10px;
            .note-history-header{
                padding: 10px;
                border-bottom: 1px solid #eeeeee;
            }
            .time{
                color: #333333;
                font-size: 14px;
                font-weight: bold;
            }
            .recovery{
                color: #999;
                font-size: 12px;
                cursor: pointer;
                &:hover{
                    color: $purple;
                }
            }
            .content{
                color: #333;
                font-size: 14px;
                margin-top: 4px;
                padding: 10px;
            }
        }
    }
</style>