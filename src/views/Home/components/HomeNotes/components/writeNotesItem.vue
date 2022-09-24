<template>
    <div class="user-menu">
        <div class="flex align-center">
            <el-avatar
                    :size="50"
                    :src="userInfo?.avatar"
                    fit="fill"
            />
            <div class="user-info">
                <p class="line-1">{{userInfo?.name}}</p>
                <proIcon
                        :isPro="userBase?.is_pro"
                        :isEdu="userBase?.is_edu"
                        width="44px"
                        style="display: block"
                        @click="openUrlByBrowser('https://fangcun.in/BuyPage')"
                />
            </div>
        </div>
        <ul class="user-list">
            <li @click="openUrlByBrowser('https://fangcun.in/user')"> ⚙️ 账户信息</li>
            <li @click="openUrlByBrowser('https://help.fangcun.in/help/note.html')"> 🤝 帮助中心</li>
            <li @click="showMobileUse = true"> 📱 手机使用</li>
            <li @click="showWxQun = true"> 💬 加入社群</li>
            <li @click="signOut" class="delete"> 🏃 注销登入</li>
        </ul>
    </div>
    <!-- 加入社群弹窗 -->
    <el-dialog
            title="共建微信群"
            center
            width="250px"
            v-model="showWxQun"
            destroy-on-close
            append-to-body
    >
        <img style="width: 100%" src="@/assets/image/wxqun.png" alt="">
    </el-dialog>
    <!-- 手机使用二维码-->
    <el-dialog
            title="手机使用"
            center
            width="250px"
            v-model="showMobileUse"
            destroy-on-close
            append-to-body
    >
        <div class="H5Qr">
            <p class="text-center font-14 color-9">请使用手机扫描二维码体验，或者，你可以先<a class="cursor-p color-purple" @click="openUrlByBrowser('https://help.fangcun.in/help/h5.html')">了解如何使用</a ></p>
            <img style="width: 100%" src="https://stor-assets.fang-cun.net/h5_qr.png" alt="">
        </div>
    </el-dialog>
</template>

<script setup>
    import { ref, computed, defineAsyncComponent } from "vue"
    import { useStore } from "vuex"
    import { useRouter } from 'vue-router'
    // hooks
    import openUrlByBrowser from "@/assets/js/openUrlByBrowser";
    import { removeToken } from "@/utils/auth";
    // 组件
    import { ElMessageBox } from 'element-plus'
    // 异步组件
    const proIcon = defineAsyncComponent(() => import('@/components/element/proIcon.vue'))

    const store = useStore()
    const router = useRouter()

    // computed
    const userInfo = computed(() => store.state.user.userInfo)
    const userBase = computed(() => store.state.user.userBase)

    // data
    let showMobileUse = ref(false)
    let showWxQun = ref(false)

    // methods
    function signOut(){
        ElMessageBox.confirm('确认退出？', {
            type: 'warning',
            cancelButtonText: '取消',
            confirmButtonText: '退出',
            confirmButtonClass: 'sign-out-style'
        }).then(() => {
            removeToken()
            store.commit('CLEAR_VUEX')
            store.dispatch('user/resetToken').then(() => {
                router.push({
                    name: "Login"
                })
            })
        }).catch(err => {})
    }
</script>

<style lang="scss" scoped>
    .user-menu{
        .user-info{
            margin-left: 10px;
            p{
                width: 70px;
                font-size: 16px;
                color: #6F7A93;
            }
        }
        .user-list{
            list-style: none;
            padding: 0;
            margin: 16px 0 0;
            li{
                text-align: center;
                padding: 8px 0;
                color: #6F7A93;
                border-radius: 4px;
                cursor: pointer;
                &:hover{
                    background-color: rgba(120,133,209,.1)!important;
                    color: #7885d1!important;
                }
            }
            .delete{
                &:hover{
                    color: #b22222!important;
                    background: rgba(178,34,34,.1)!important;
                }
            }
        }
    }
</style>
<style lang="scss">
    .sign-out-style{
        background: #e6a23c!important;
        border-color: #e6a23c!important;
        &:hover{
            background: #e6a23c!important;
            border-color: #e6a23c!important;
            opacity: 0.9;
        }
    }
</style>