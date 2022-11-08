<template>
    <div class="write-container" @contextmenu="handleRightClick">
        <div class="header">
            <div class="flex align-center">
                <span class="time">{{item.updated_time}}</span>
                <div class="write-flag">
                    <font-awesome-icon icon="file-lines" class="icon color-purple"/>
                    <span>写作模式</span>
                </div>
                <div class="write-flag can-click" @click="openWrite">
                    <font-awesome-icon icon="eye" class="icon" />
                    <span>查看</span>
                </div>
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
                        <font-awesome-icon v-show="item.collection.is_team === 1" icon="user-friends" class="mr6" style="font-size: 12px;" color="#9EA0AD" />
                    </div>
                </div>
                <!-- <el-dropdown size="small" trigger="click">
                    <font-awesome-icon icon="ellipsis-h" style="font-size: 16px;" color="#9EA0AD" />
                    <template #dropdown>
                        <el-dropdown-menu v-if="isTrash">
                            <el-dropdown-item @click="recoverNote(item, index)">
                                <font-awesome-icon class="font-icon" icon="trash-restore" color="#9EA0AD" />恢复笔记
                            </el-dropdown-item>
                            <el-dropdown-item class="delete" @click="deleteNote(item, index)">
                                <font-awesome-icon class="font-icon" icon="trash-alt" color="#9EA0AD" />删除笔记
                            </el-dropdown-item>
                        </el-dropdown-menu>
                        <el-dropdown-menu v-else>
                            <el-dropdown-item @click="openWrite" v-if="item.is_self === 1">
                                <font-awesome-icon icon="edit" style="width:20px!important;" color="#9EA0AD" />编辑
                            </el-dropdown-item>
                            <div class="delete" v-if="item.is_self === 1">
                                <el-dropdown-item divided @click="moveTrashCan(item.id, index)">
                                    <font-awesome-icon class="font-icon" icon="trash-alt" color="#9EA0AD" />扔到废纸篓
                                </el-dropdown-item>
                            </div>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown> -->
            </div>
        </div>
        <div class="show-tag">
            <span class="hashtag-suggestion" v-for="tag in item.tags" :key="tag.id" :data-id="tag.tag" @click="getNoteNodeClick($event)">#{{tag.tag}}</span>
        </div>
        <div class="content" @dblclick="openWrite">
            <!--            <div class="file-icon" @click="openWrite">-->
            <!--                <font-awesome-icon class="icon" icon="file-lines" />-->
            <!--&lt;!&ndash;                <span class="unselectable">进入写作</span>&ndash;&gt;-->
            <!--            </div>-->
            <p class="line-3" v-if="item.desc">{{item.desc}}</p>
            <p class="line-3 color-9" v-else>📝[你还没开始写] {{item.created_at}} 的写作</p>
        </div>
    </div>
</template>

<script setup>
    import { computed, defineProps, defineEmits} from "vue"
    import { useStore } from "vuex"
    import bus from '@/utils/bus'
    import { simpleEditor } from "../js/editor";
    import {ElMessageBox} from "element-plus";
    import { getNoteNodeClick } from '../js/editorMethods'
    import { getHtmlToJson } from "../js/writeEditor";

    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;
    const tagTool = require('service/tool/tag')

    const store = useStore()
    const emit = defineEmits(['deleteNote']);
    const matchReg = /\#(\S+?)?\s{1}/g

    const props = defineProps({
        item:{
            type: Object,
            default: {}
        },
        index: {
            type: Number,
            default: 0
        },
        isTrash: {
            default: ""
        }
    })

    // 右击方法
    const handleRightClick = () => {
        let menu = new Menu()
        if(props.isTrash){
            menu.append(new MenuItem({ label: '🗂 恢复笔记', click: recoverNote }))
            menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({ label: '🗑 删除笔记', click: deleteNote }))
        }else{
            menu.append(new MenuItem({ label: '📝 查看', click: openWrite }))
            menu.append(new MenuItem({ label: '📄 复制', role: 'copy' }))
            menu.append(new MenuItem({ type: 'separator' }))
            menu.append(new MenuItem({ label: '🗑 扔到废纸篓', click: moveTrashCan }))
        }
        menu.popup()
    }

    // computed -------------
    const collectionListSelf = computed(() => store.state.collection.projectListSelf)
    const collectionListTeam = computed(() => store.state.collection.projectListTeam)

    // methods ---------------
    async function resetCollection(collection){
        if(collection.id === props.item.collection_id) return false

        let contentJson = getHtmlToJson(props.item.note)
        let contentHtml = props.item.note
        let postil_list = props.item.quote.map(item => item.id)

        let params = {
            contentHtml,
            contentJson,
            collection_id: collection.id,
            noteId: props.item.id,
            postil_list,
            tag_list: tagTool.json2List(contentJson),
            noteType: 2,
            index: props.index
        }
        const res = await store.dispatch("notes/editNote", params)
        if(res.status_code === 200){
            props.item.collection.color = res.data.collection.color
            props.item.collection.collection = res.data.collection.collection
            props.item.collection_id = res.data.collection_id
        }
    }

    const openWrite = () => {
        // bus.emit("READ_ARTICLE", {
        //     item: props.item,
        //     index: props.index
        // })
    }

    // 删除该笔记
    function moveTrashCan(){
        ElMessageBox({
            title: '提示',
            message: "确定将这条笔记扔到废纸篓吗?",
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        }).then(() => {
            emit("deleteNote")
            store.dispatch("notes/removeNote",{
                id: props.item.id,
                index: props.index,
                note_type: 2
            })
            store.dispatch("user/getUserBase")
        }).catch(()=>{})
    }
    // 回收站恢复笔记
    function recoverNote(){
        store.dispatch("notes/recoverNote",{
            note_id: props.item.id,
            index: props.index
        })
        store.dispatch("user/getUserBase")
    }
    // 回收站删除笔记
    function deleteNote(){
        emit("deleteNote")
        store.dispatch("notes/deleteNote",{
            note_id: props.item.id,
            index: props.index,
            note_type: 2
        })
        store.dispatch("user/getUserBase")
    }

</script>

<style lang="scss" scoped>
    .write-container{
        padding: 0 10px;
        .header{
            display: flex;
            justify-content: space-between;
            align-items: center;
            .time{
                color: #999999;
                font-size: 12px;
            }
            .write-flag{
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 0 8px;
                border-radius: 2px;
                color: #999999;
                margin-right: 10px;
                .icon{
                    font-size: 10px;
                }
                span{
                    font-size: 12px;
                    margin-left: 4px;
                }
            }
            .can-click{
                transition: all 0.3s;
                background: rgba($color: $purple, $alpha: 0.1);
                color: $purple;
                &:hover{
                    background: $purple2;
                    color: #eeeeee;
                }
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
        .show-tag{
            padding: 4px 0 0px;
            .hashtag-suggestion {
                cursor: pointer;
                color: $purple;
                border-radius: 2px;
                padding: 0 2px;
                font-size: 12px;
                margin-right: 8px;
                background: rgba($purple, 0.1);
                white-space: normal;
                display: inline-block;
                line-height: 20px;
                &:hover{
                    color: #fff;
                    background: $purple;
                }
            }
        }
        .content{
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #333333;
            padding: 10px 0;
            .file-icon{
                width: 60px;
                flex-shrink: 0;
                margin-right: 6px;
                padding: 8px 0;
                border-radius: 4px;
                cursor: pointer;
                transition: all .2s;

                &:hover{
                    background: rgba($color: $purple, $alpha: 0.1);
                    color: #676767;
                }
                .icon{
                    display: block;
                    font-size: 40px;
                    color: #cccccc;
                    margin: 0 auto;
                }
                span{
                    display: block;
                    text-align: center;
                    font-size: 12px;
                    color: #999999;
                    border-radius: 2px;
                    margin-top: 4px;
                }
            }
        }
    }
</style>