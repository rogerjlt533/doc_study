import { ElMessageBox } from 'element-plus'
import { goLogin } from '@/utils/request-desktop'
import store from '@/store/index'
import { ipcRenderer } from 'electron'

let fs = require('fs')
const path = require('path')
const remote = require("@electron/remote");

const dirname = remote.app.getPath("userData")
const filePath = path.join(dirname, 'config.json')
let vuexData = {
    vuex: {
        showTagsGroup: false,
        editorHeight: 0,
        user:{
            isShowNotice: false,
            token: "",
            userInfo: {},
            userSetting: {},
            userBase: {},
            noticeList: [],
            userRight: null,
            userQuickList: []
        },
        notes:{
            cachedNote: "",
            notesListHeight: "calc(100vh - 196px)",
            classifyObj: {
                title: '我的笔记',
                actived: 0,
                collectionActived: null,
                collectionType: null,
                activedTag: null
            },
            notes:{
                tag_id: undefined,
                group_id: undefined,
                collection_id: undefined,
                trash: undefined,
                today: undefined,
                note_type: 1,
                sort: "desc"
            },
            writeNoteActive:{
                active: 0
            },
            editorCollection:{
                checked_collection: "",
                collection_id: "",
            },
            tagToCollectionId: "",
            writeNote: [],
            noteslist: [],
            tagsGroupList: [],
            tagsAllList: [],
            tagsTopList: [],
            tagsList: [],
            isFinish: true
        },
        collection: {
            projectListSelf: [],
            projectListTeam: []
        }
    },
    token: ''
}

// 检测缓存文件config.json 是否有问题，否则重置内容
export function handleRestructureConfig(type){
    // 检查文件是否存在
    const fileStatus = fs.existsSync(filePath)
    if(!fileStatus){
        createOrWriteFile(type)
        return false
    }

    // 检查文件大小是否为空
    const dataObj = fs.statSync( filePath )
    if(dataObj.size === 0){
        createOrWriteFile(type)
        return false
    }

    // 检查文件是否异常
    try {
        const json = fs.readFileSync(filePath, 'utf8')
        // 如果读取的json 解析的时候报错，那么就将config重置内容
        JSON.parse(json)
    } catch (err) {
        createOrWriteFile(type)
    }
}

function createOrWriteFile(type){
    if(type === 1){
        const fileContent = JSON.stringify(vuexData)
        fs.writeFileSync(filePath, fileContent)

        ipcRenderer.send('updateWin')
    }

    ElMessageBox.alert('检测到运行错误，请点击重置配置文件', {
        type: 'warning',
        confirmButtonText: '重置',
        showCancelButton: false,
        autofocus: false,
        showClose: false,
    }).then(() => {
        if(store && store.state.user.userInfo.token){
            vuexData.token = store.state.user.userInfo.token
            vuexData.vuex.user = store.state.user
        }
        const fileContent = JSON.stringify(vuexData)
        fs.writeFileSync(filePath, fileContent)
        if(vuexData.token){
            ipcRenderer.send('updateWin')
        }else{
            goLogin()
        }
    })
}
