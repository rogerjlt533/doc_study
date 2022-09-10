<template>
    <div class="note-set">
        <ul>
            <li>
                <span class="name">同步至Notion</span>
                <div>
                    <el-button
                            size="small"
                            class="color-white"
                            type="primary"
                            @click="openNotionAut"
                            :loading="authorizeLoading"
                            color="#7885d1"
                    >{{authorizeLoading ? '授权中' : notionBind ? '已授权，重新授权' : '授权'}}</el-button>
                </div>
            </li>
        </ul>
        <p class="tips">使用前，请先移步 <a class="atag" target="_blank" href="https://help.fangcun.in/help/notion.html">帮助中心</a> </p>
    </div>
</template>

<script setup>
    import {ref, defineProps, toRefs, nextTick} from "vue"
    import { notionSyncApi, getNotionDatabasesApi, bindStatusApi } from "@/api/user"
    import { useRoute } from "vue-router"
    import { ElMessage, ElMessageBox } from "element-plus";

    const route = useRoute()

    const props = defineProps({
        userRight: {
            type: Object,
            default: {}
        }
    })
    const { userRight } = toRefs(props)

    /**
     * 判断是不是从notion进入的，用来获取code
     */
    let notionCode = ref()
    let authorizeLoading = ref(false)
    if(route.query?.code && route.query?.state === "notion"){
        notionCode.value = route.query.code
        authorizeLoading.value = true
        authorization()
        // 获取id位置,并移动过去
        // nextTick(() => {
        //     let postion = document.getElementById("syncNote")
        //     let top = postion.offsetTop
        //     window.scrollTo(0, top);
        // })
    }
    const openNotionAut = () => {
        if(userRight.value.is_pro){
            location.href = "https://www.notion.so/install-integration?response_type=code&client_id=5f2c5190-b301-412f-a919-436d764c1c62&redirect_uri=https%3A%2F%2Ffangcun.in%2Fuser&owner=user&state=notion"
            return false
        }
        ElMessageBox.confirm("PRO会员才有权限使用此功能哦~",{
            type: "warning",
            confirmButtonText: "立即开通",
            cancelButtonText: "就这样吧"
        }).then(() => {
            router.push({
                name: "BuyPage"
            })
        }).catch((err)=>{})
    }
    let notionBind = ref(false)
    function getBindStatus(){
        bindStatusApi().then((res) => {
            console.log(res)
            if(res.code == 200){
                notionBind.value = !!res.data.is_bind
            }
        })
    }getBindStatus()
    function authorization(){
        let data = {
            code: notionCode.value
        }
        notionSyncApi(data).then(res => {
            authorizeLoading.value = false

            if(res.code == 200){
                ElMessage.success("授权成功！")
                // 授权成功后调用一次接口
                getBindStatus()
                getNotionDatabasesApi()
            }
        })
    }
</script>

<style lang="scss" scoped>

</style>