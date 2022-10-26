<template>
    <div class="file-container">
        <div class="mode">
            <div class="mode-1" @click="switchNoteMode(true)">
                <font-awesome-icon class="icon-font plus" icon="plus"></font-awesome-icon>
            </div>
            <div class="mode-2" @click="switchNoteMode(false)">
                <h4 class="unselectable">记录</h4>
                <font-awesome-icon class="icon-font" icon="angle-right"></font-awesome-icon>
            </div>
        </div>
        <div class="file-box" v-if="notesLongList && notesLongList.length">
            <div
                    class="file-list unselectable"
                    v-for="(item, index) in notesLongList"
                    :key="item.id"
                    :class="[writeNoteActive.active === item.id ? 'active' : '']"
                    @click="triggerNote(item, index)"
                    @contextmenu="rightClickNote(item, index)"
            >
                <div class="file-content">
                    <p class="note-title line-1" v-if="item.title">{{item.title}}</p>
                    <p class='note-title note-title-none' v-else>您还没有开始写作哦~~</p>
                    <p class='note-desc line-2' v-if="item.desc?.trim()">{{item.desc}}</p>
                    <p class='note-desc note-desc-none' v-else>写点东西吧......</p>
                    <span class="note-time">{{item.update_time || item.updated_time}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import {ref, defineEmits, onMounted, computed} from "vue"
    import { useStore } from "vuex";
    import bus from '@/utils/bus'
    import handleFileOperation from './HomeNotes/js/handleFile'
    import { ElMessageBox, ElNotification } from "element-plus"
    const {ipcRenderer} = require('electron')
    const remote = require('electron').remote;
    const Menu = remote.Menu;
    const MenuItem = remote.MenuItem;


    const emits = defineEmits(['switch'])
    const store = useStore()

    let notesLongList = computed(() =>  store.state.notes.notesLongList )
    let writeNoteActive = computed(() => store.state.notes.writeNoteActive)

    // console.log(ipcRenderer)
    // window.addEventListener('contextmenu', function (e) {
    //     e.preventDefault()
    //     let menu = new Menu()
    //     //添加菜单功能, label: 菜单名称， accelerator：快捷键，click：点击方法
    //     menu.append(new MenuItem({ label: '复制', click: ()=>{console.log('1111')} }))
    //     //添加菜单分割线
    //     menu.append(new MenuItem({ type: 'separator' }))
    //     //添加菜单功能
    //     menu.append(new MenuItem({ label: '粘贴', click: ()=>{console.log('22222')}  }))
    //     menu.popup()
    // }, false)

    let rightClickItem = {}
    function rightClickNote(item, index){
        rightClickItem.item = item
        rightClickItem.index = index
        let menu = new Menu()
        // 添加菜单功能, label: 菜单名称， accelerator：快捷键，click：点击方法
        // menu.append(new MenuItem({ label: '重命名', click: renameItem }))
        // 添加菜单分割线
        // menu.append(new MenuItem({ type: 'separator' }))
        // 添加菜单功能
        menu.append(new MenuItem({ label: '删除', click: deleteItem }))
        menu.popup()
    }
    function deleteItem(){
        ElMessageBox.confirm('确定删除这条笔记吗？', {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
        }).then(async ()=>{
            const id = rightClickItem?.item.id
            const index = rightClickItem?.index
            const res = await store.dispatch("notes/removeNote",{ id, index, note_type: 2 })
            if(res){
                ElNotification.success('删除成功！')
            }
        }).catch(()=>{})
    }

    function switchNoteMode(type = false){
        if(type){
            addNote()
        }
        emits('switch', type)
        store.commit('notes/CHANGE_WRITE_NOTE_ACTIVE', { active: -1 })
    }
    function triggerNote(item, index){
        emits('switch', true)
        // bus.emit("READ_ARTICLE", {item, index})
        store.commit('notes/CHANGE_WRITE_NOTE_ACTIVE', { active: item.id })
    }
    async function addNote(){
        let params = {
            contentJson: {"type":"doc","content":[{"type":"paragraph"}]} ,
            contentHtml: '<p></p>',
            note_type: 2
        }
        const res = await store.dispatch("notes/addNotes", params)
        // bus.emit("READ_ARTICLE", { item: res.data, index: 0})
        // store.commit('notes/SET_WRITE_NOTE_FILE', list)
        // handleFileOperation.createFile().then((res) => {
        //     if(res.status === 'success'){
        //         let list = notesLongList.value
        //         list.unshift(res.data)
        //         store.commit('notes/SET_WRITE_NOTE_FILE', list)
        //         readThisArticle(res.data)
        //     }
        // })
    }

    // mounted ------------
    onMounted(() => {
        // handleFile = new FileOperation()
        // // 获取文件的名称列表
        // handleFile.readFolder()
    })

</script>

<style lang="scss" scoped>
    .file-container{
        .mode{
            display: flex;
            margin-bottom: 4px;
            >div{
                display: flex;
                border-radius: 4px;
                padding: 10px;
                background: rgba($color: $purple, $alpha: 0.1);
                cursor: pointer;
                transition: all .3s;
                &:hover{
                    h4, .icon-font{
                        color: #ffffff;
                    }
                    background: rgba($color: $purple, $alpha: 0.5);
                }
            }
            .mode-1{
                margin-right: 4px;
            }
            .mode-2{
                width: calc(100% - 46px);
                justify-content: space-between;
            }
            h4{
                margin: 0;
                color: #666666;
                font-size: 16px;
            }
            .icon-font{
                width: 14px;
                padding: 4px;
                border-radius: 4px;
                color: #666666;
            }
        }
        .file-box{
            height: calc(100vh - 94px);
            overflow: scroll;
            scrollbar-color: transparent transparent;
            &::-webkit-scrollbar {
                display: none;
            }
            .file-list{
                padding: 12px 4px 8px;
                cursor: pointer;
                border-radius: 4px;
                border-bottom: 1px solid #eeeeee;
                &:hover{
                    background: #f4f4f4;
                }
                .file-content{
                    .file-header{
                        .time{
                            font-size: 12px;
                            color: #999999;
                        }
                    }
                    .note-title{
                        width: 100%;
                        color: #333333;
                        font-size: 14px;
                        font-weight: 700;
                    }
                    .note-title-none{
                        color: #999999;
                        font-size: 14px;
                    }
                    .note-desc{
                        font-size: 12px;
                        color: #666666;
                        margin-top: 6px;
                    }
                    .note-desc-none{
                        color: #999999;
                    }
                    .note-time{
                        display: inline-block;
                        color: #999999;
                        font-size: 12px;
                        margin-top: 6px;
                    }
                }
            }
            .active{
                background: #f4f4f4;
            }
        }
    }
</style>