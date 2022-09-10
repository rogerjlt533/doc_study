import { reactive, ref} from "vue"
import { signOutApi, shiftOutApi, addTeamApi } from "@/api/target"
import { ElNotification } from "element-plus";
import store from "@/store"

let isDeleteTeam = ref(false)
let collectionParams = ref({})
let inviteData = reactive({
    show: false,
    qr_code: ""
})

// 踢出团队笔记本
function shiftTeamCollection(userId, index){
    let data = {
        collection_id: collectionParams.value.id,
        user: userId
    }
    shiftOutApi(data).then(res => {
        console.log(res)
        if(res.code === 200){
            collectionParams.value.members.splice(index, 1)
            ElNotification.success("移除成功")
        }
    })
}

// 退出团队笔记本
function signOutApiCollection(){
    let data = {
        collection_id: collectionParams.value.id,
    }
    signOutApi(data).then(res => {
        if(res.code === 200){
            store.dispatch("collection/getCollection");
            ElNotification.success("退出成功")
        }
    })
}

// 邀请加入团队笔记本
function inviteTeam(){
    let data = {
        collection_id: collectionParams.value.id,
        method: 3
    }
    addTeamApi(data).then((res) => {
        if(res.code === 200){
            inviteData.show = true
            inviteData.qr_code = res.data.qr_code
        }
    })
}

export {
    isDeleteTeam,
    collectionParams,
    inviteData,
    shiftTeamCollection,
    signOutApiCollection,
    inviteTeam
}