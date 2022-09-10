<template>
    <div ref="shortNoteItemRef" @contextmenu="handleRightClick($event)" >
        <div class="line-one" :id="'note-id-' + item.id" draggable="true">
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
                            <font-awesome-icon v-show="item.collection.is_team === 1" icon="user-friends" class="mr6 font-12" color="#9EA0AD" />
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                        :class="[collect.id === item.collection_id ? 'collect-dropdown-active' : '']"
                                        v-for="(collect,index) in collectionListSelf" :key="index"
                                        @click="resetCollection(collect,index)">
                                    {{collect.collection}}
                                </el-dropdown-item>
                                <el-divider v-if="collectionListSelf.length && collectionListTeam.length" class="mt4 mb4"></el-divider>
                                <el-dropdown-item
                                        :class="[collect.id === item.collection_id ? 'collect-dropdown-active' : '']"
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
                        <font-awesome-icon v-show="item.collection.is_team == 1" icon="user-friends" class="mr6 font-12" color="#9EA0AD" />
                    </div>
                </div>
            </div>
        </div>
        <div ref="htmlRef" class="line-two">
            <div class="content-html" v-html="showThumbnail ? item.curtNote : item.note" @click="getNoteNodeClick" @dblclick="dblclickNote"></div>
            <div class="resource-url" v-if="item.url" @click="openUrlByBrowser(item.url)">
                <div>
                    <span>来源网站</span>
                    <font-awesome-icon class="font-icon" icon="caret-right" color="#7885d1" />
                </div>
            </div>
        </div>
        <div class="picture-box" v-if="item.imgSrc?.length">
            <el-divider content-position="right">
                <span class="card-detail unselectable" @click="openCardDetails">
                    {{showThumbnail ? '卡片原文' : '折叠'}}
                </span>
            </el-divider>
            <div class="picture" v-show="showThumbnail">
                <el-image
                        v-for="(img,index) in item.imgSrc"
                        :key="index"
                        class="picture-img"
                        fit="cover"
                        :src="img"
                        :preview-src-list="item.imgSrc"
                        :initial-index="index"
                        :hide-on-click-modal="true"
                ></el-image>
            </div>
        </div>

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
    import {ref, defineProps, onMounted, defineEmits, computed} from "vue";
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    // hooks ----
    import { simpleEditor } from "../js/cardEditor"
    import { getNoteNodeClick } from '../js/editorMethods'
    import { deepClone, openUrlByBrowser } from "@/utils/tools"
    import request from "@/utils/mainRequest"
    // 组件 ----
    import previewImg from "@/components/imagePreview"
    import { ElMessageBox, ElNotification } from "element-plus"
    import { RefreshLeft } from '@element-plus/icons-vue'
    import fcDialog from "@/components/dialog"
    import fcContextMenu from "@/components/contextMenu"

    // const remote = require('electron').remote;
    // const Menu = remote.Menu;
    // const MenuItem = remote.MenuItem;

    const store = useStore()
    const emit = defineEmits(['deleteNote', 'editNote'])

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

    const isPro = computed(() => store.state.user.userBase.is_pro)

    // 右击笔记本
    const shortNoteItemRef = ref(null)
    const handleRightClick = (e) => {
        e.preventDefault()
        // let menu = new Menu()
        // if(props.isTrash){
        //     menu.append(new MenuItem({ label: '🗂 恢复笔记', click: recoverNote }))
        //     menu.append(new MenuItem({ type: 'separator' }))
        //     menu.append(new MenuItem({ label: '🗑 删除笔记', click: deleteNote }))
        // }else{
        //     menu.append(new MenuItem({ label: '📝 编辑', click: () => emit('editNote') }))
        //     menu.append(new MenuItem({ label: '💬 引用', click: annotation }))
        //     menu.append(new MenuItem({ label: '📔 转为写作', click: cardToWrite }))
        //     if(isPro.value) menu.append(new MenuItem({ label: '🚀️ 立即同步', click: urgentPushNote }))
        //     menu.append(new MenuItem({ type: 'separator' }))
        //     menu.append(new MenuItem({ label: '🗑 扔到废纸篓', click: moveTrashCan }))
        // }
        // menu.popup()

        let menuList = []
        if(props.isTrash){
            menuList = [{
                type: 'item',
                title: '🗂 恢复笔记',
                command: recoverNote,
            },{
                type: 'separator',
                title: '',
            },{
                type: 'item',
                title: '🗑 删除笔记',
                command: deleteNote,
            }]
        }else{
            menuList = [{
                type: 'item',
                title: '📝 编辑',
                command: () => emit('editNote'),
            },{
                type: 'item',
                title: '💬 引用',
                command: annotation,
            },{
                type: 'item',
                title: '📔 转为写作',
                command: cardToWrite,
            },{
                type: 'item',
                title: '🚀️ 立即同步',
                command: urgentPushNote,
            },{
                type: 'separator',
                title: '',
            },{
                type: 'item',
                title: '🗑 扔到废纸篓',
                command: moveTrashCan,
            }]
        }

        fcContextMenu({
            el: shortNoteItemRef.value,
            show: true,
            x: e.clientX,
            y: e.clientY,
            list: menuList
        })
    }

    // 重置collection列表
    let collectionListSelf = ref(store.state.collection.projectListSelf);
    let collectionListTeam = ref(store.state.collection.projectListTeam);
    async function resetCollection(collection){
        if(collection.id === props.item.collection_id) return false

        const editor = simpleEditor(props.item.note)
        const res = await store.dispatch("notes/editNote", {
            html: editor.getHTML(),
            json: editor.getJSON(),
            collection_id: collection.id,
            noteId: props.item.id,
            postil_list: props.item.quote.map(item => item.id),
            index: props.index
        })
        if(res.status_code === 200){
            editor.commands.clearContent()
            props.item.collection.color = res.data.collection.color
            props.item.collection.collection = res.data.collection.collection
            props.item.collection_id = res.data.collection_id

            store.commit('notes/REMOVE_NOTE', {
                index: props.index,
                note_type: 1
            })
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
        bus.emit("setAnnotationId", {
            item: props.item,
            isOverHeight: isOverHeight.value
        })
    }

    // 卡片笔记转写作模式
    function cardToWrite(){
        request({
            api: 'convertToPageApi',
            key: 'convertToPageApi',
            data: {
                user_id: store.state.user.userInfo.id,
                note_id: props.item.id
            }
        }, (res) => {
            if(res.status_code === 200){
                store.commit('notes/REMOVE_NOTE', {
                    index: props.index,
                    note_type: 1
                })
                let noteData = deepClone(props.item)
                noteData.note_type = 2
                store.commit('notes/ADD_NOTE', {
                    note_type: 2,
                    data: noteData
                })
            }
        })
    }

    // 强制推送笔记
    function urgentPushNote(){
        request({
            api: 'urgentPushNoteApi',
            key: 'urgentPushNoteApi',
            data: {
                user_id: store.state.user.userInfo.id,
                note_id: props.item.id
            }
        })
    }

    // 编辑笔记
    // function editNote(){
    //     setTimeout(() => {
    //         props.item.ifEditCon = true
    //     }, 150)
    // }
    // 双击编辑笔记
    function dblclickNote(){
        if(props.isTrash || props.item.is_self !== 1) return false
        emit('editNote')
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
        console.log("!@3123123")
        emit("deleteNote")
        store.dispatch("notes/deleteNote",{
            note_id: props.item.id,
            index: props.index,
            note_type: 1
        })
        store.dispatch("user/getUserBase");
    }

    // 展开全文逻辑
    const showThumbnail = ref(true)
    function openCardDetails(){
        showThumbnail.value = !showThumbnail.value
        if(showThumbnail.value){
            document.getElementById(`note-id-${props.item.id}`).scrollIntoView()
        }
    }

    // 获取笔记历史
    let showNoteHistory = ref(false);
    let notesHistoryList = ref([]);
    let noteHistory = {};
    function getNoteHistory(){
        noteHistory.id = props.item.id;
        const data = {
            user_id: store.state.user.userInfo.id,
            note_id: props.item.id,
            page: 1,
            size: 50
        }
        request({
            api: 'getNotesHistoryApi',
            key: 'getNotesHistoryApi',
            data
        }, (res) => {
            if(res.status_code === 200){
                showNoteHistory.value = true;
                notesHistoryList.value = res.data.histories
            }
        })
    }
    // 恢复历史笔记
    async function recoveryHistoryNote(item){
        noteHistory.note = item.former_note
        request({
            api: 'rollHistoryApi',
            key: 'rollHistoryApi',
            data: {
                user_id: store.state.user.userInfo.id,
                history_id: item.id
            }
        }, (res) => {
            if(res.status_code === 200){
                ElNotification({
                    message: '笔记已恢复！',
                    type: 'success'
                });
                store.commit("notes/RECOVERY_HISTORY", noteHistory)
            }
        })
    }

    //判断内容高度
    let isOverHeight = ref(0);
    let htmlRef = ref(null);
    let ifSetFlod = computed(() => { return store.state.user.userSetting.fold_note });
    onMounted(() => {
        if(ifSetFlod.value === 1){
            setTimeout(() => {
                if(htmlRef.value){
                    isOverHeight.value = htmlRef.value.offsetHeight;
                }
            }, 100)
        }
    })
</script>

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
    //.trigger-style{
    //    &:hover{
    //        box-shadow: 0px 1px 4px -2px rgba($color: #000000, $alpha: 0.5);
    //    }
    //    &:active{
    //        box-shadow: 0px 0px 4px -3px rgba($color: #000000, $alpha: 0.5);
    //    }
    //}

    .picture-box{
        margin: 10px 10px 0 10px;
        padding: 10px 0px;
        .card-detail{
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            color: #666666;
            background: #FFFFFF;
            &:hover{
                background: rgba($color: $purple, $alpha: 0.5);
                color: #FFFFFF;
            }
            &:active{
                background: rgba($color: $purple, $alpha: 0.3);
                color: #FFFFFF;
            }
        }
        .picture{
            @include flexAlignJustify(center, flex-start);
            flex-wrap: wrap;
            .picture-img{
                width: 80px;
                height: 80px;
                margin: 2px 6px;
                border: 2px solid #dcdfe6;
                border-radius: 4px;
            }
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
<style lang="scss">
    .note-drawer{
        background: #f5f5f5;
    }

    .collect-dropdown-active{
        background-color: rgba($color: $purple, $alpha: 0.1) !important;
        color: $purple !important;
    }

    .picture-box{
        .el-divider__text{
            background: #F6F8FC !important;
        }
        .el-divider--horizontal{
            margin: 10px 0;
        }
    }
</style>