import { ref } from "vue"
import { getNotionDatabasesApi, bindNotionDatabaseApi, syncNotionDatabaseApi, relationNotionDatabaseApi, bindStatusApi } from "@/api/user"
import { ElMessageBox, ElNotification, ElMessage } from "element-plus";
import router from "@/router"

let showBasicsGraph = ref(false)
let notionBasicsLoading = ref(true)
let notionCollectionId = ""
let database = ref()
let syncAct = ref()
let databaseList = ref([])

function getDatabaseList(){
    getNotionDatabasesApi().then((res) => {
        if(res.code == 200){
            databaseList.value = res.data
            relationNotionDatabase()
        }
    })
}

function bindNotionDatabase(){
    if(!database.value){
        ElMessage.warning("请选择database")
        return false
    }
    let data = {
        collection_id: notionCollectionId,
        database_id: database.value
    }
    bindNotionDatabaseApi(data).then((res) => {
        if(res.code == 200){
            changeSyncStatus()
            ElMessageBox.confirm(
                "<p>绑定成功！</p>" +
                "<p>请一段时间后在notion查看，如果笔记比较多，同步时间相应会较长，请耐心等待。</p>",
            {
                type: "success",
                dangerouslyUseHTMLString: true,
                confirmButtonText: "知道了",
                showCancelButton: false
            }).then(() => {
            }).catch((err)=>{})

            // 绑定完成后重新调用一下database接口，用语后台记录
            getNotionDatabasesApi()
        }
    })
}
// 同步
function changeSyncStatus(){
    let data = {
        collection_id: notionCollectionId
    }
    syncNotionDatabaseApi(data).then((res) => {
        if (res.code == 200) {
            refreshRelation().then()
        }
    })
}

// 初始化数据
function relationNotionDatabase(){
    database.value = ""
    syncAct.value = false
    refreshRelation().then(() => {
        notionBasicsLoading.value = false
    })
}

function refreshRelation(){
    const data = {
        collection_id: notionCollectionId
    }
    return new Promise(resolve => {
        relationNotionDatabaseApi(data).then((res) => {
            resolve(true)
            if(res.code == 200){
                database.value = res.data.database_id
                syncAct.value = !!Number(res.data.is_act)
            }
        })
    })
}

// 初始化
function basics(el){
    bindStatusApi().then((res) => {
        if(res.code == 200){
            if(!!res.data.is_bind){
                notionBasicsLoading.value = true
                notionCollectionId = el.id
                getDatabaseList()
                showBasicsGraph.value = true
            }else{
                ElMessageBox.confirm(
                    "需要到个人中心进行Notion授权",
                    {
                        type: "warning",
                        confirmButtonText: "去授权",
                        cancelButtonText: "取消"
                    }).then(() => {
                    router.push({
                        name: "User"
                    })
                }).catch((err)=>{})
            }
        }
    })
}

export {
    showBasicsGraph,
    notionBasicsLoading,
    database,
    syncAct,
    databaseList,
    getDatabaseList,
    bindNotionDatabase,
    changeSyncStatus,
    basics
}
