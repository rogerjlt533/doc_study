<template>
    <div class="container">
        <div class="loginForm">
            <img class="fangcun" src="@/assets/image/fangcun.png" alt="">
            <p class="fangcun-text">方寸笔迹 · 桌面端</p>
            <template v-if="loginWay === 'password'">
                <el-form ref="loginFormRef" :model="login.form" :rules="login.rules" label-width="0">
                    <el-form-item label="" prop="emailMobile">
                        <el-input v-model="login.form.emailMobile" size="medium" placeholder="请输入手机号"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="password">
                        <el-input type="password" v-model="login.form.password" size="medium" placeholder="请输入密码"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="privacy">
                        <div class="userAgreement">
                            <el-checkbox v-model="login.form.privacy" label="我已阅读并接受"></el-checkbox>
                            <a @click="showYinsi = true"> 隐私协议</a>
                        </div>
                    </el-form-item>
                </el-form>
            </template>
            <template v-else-if="loginWay === 'sms'">
                <el-form ref="loginFormRef" :model="login.form" :rules="login.rules" label-width="0">
                    <el-form-item label="" prop="emailMobile">
                        <el-input v-model="login.form.emailMobile" size="medium" placeholder="请输入手机号"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="sms">
                        <el-input v-model="login.form.sms" autocomplete="off" placeholder="请输入短信验证码登录" class="mr10" style="width:190px;"></el-input>
                        <fcCode :value="login.form.emailMobile" @start="startSms"></fcCode>
                    </el-form-item>
                    <el-form-item label="" prop="privacy">
                        <div class="userAgreement">
                            <el-checkbox v-model="login.form.privacy" size="small" label="我已阅读并接受"></el-checkbox>
                            <a @click="showYinsi = true"> 隐私协议</a>
                        </div>
                    </el-form-item>
                </el-form>
            </template>
            <button class="water-ripple-btn btn"
                    @click="onlogin('loginForm')"
                    v-loading="disabled"
                    element-loading-background="rgba(0, 0, 0, 0.8)"
            >登录</button>
            <div class="login-way flex justify-between">
                <p class="noneAccount" @click="router.replace({name:'Register'})">没有账号, <font>立即注册</font></p>
                <p class="change" v-if="loginWay === 'password' && false" @click="loginWay = 'sms'">短信验证码登录</p>
                <p class="change" v-else-if="loginWay === 'sms'" @click="loginWay = 'password'">账号密码登录</p>
            </div>
            <div class="other-login-way">
                <div class="oauth-bg unselectable" @click="getWxQr">
                    <img data-v-14de1f73="" title="微信" alt="微信" src="@/assets/svgPath/wx.svg" class="oauth-btn">
                </div>
            </div>
        </div>
    </div>

    <div class="beian">ICP备案证书号: <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鲁ICP备2021030472号-1</a> POWERED BY方寸笔迹®</div>

    <el-dialog title="隐私协议" v-model="showYinsi" width="600px" center>
        <el-scrollbar height="400px">
            <div class="dialog-text">
                <pre style="white-space: pre-wrap;word-wrap: break-word;">{{text}}</pre>
            </div>
        </el-scrollbar>
    </el-dialog>

    <el-dialog title="微信扫码登录" v-model="wxLogin.show" width="300px" center @close="closeWxQr">
        <img class="wx_img" :src="wxLogin.url" alt="">
        <p class="font-12 color-9 text-center pb10">如果已有账户，需要在个人中心绑定微信后可启用微信登录</p>
    </el-dialog>
</template>

<script setup>
    import { reactive, ref, unref } from "vue"
    import { useRouter, useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
    import { useStore } from "vuex"
    // import { ipcMain, ipcRenderer } from 'electron'
    import { ipcRendererInvoke } from '@/utils/processIpc'
    import { getSmsApi, verifySmsApi, getWxQrApi, rotateWxApi } from "@/api/user"
    import { wxQrLoginApi } from "@/apiDesktop/user";
    import { loginApi, getUserBaseApi } from '@/apiDesktop/user'
    import { setToken, encryption } from "@/utils/auth"
    import text from "@/assets/js/yinsixieyi.js"
    import { ElNotification, ElMessage, ElLoading } from "element-plus"
    import fcCode from "@/components/element/fc-code.vue";

    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    let showYinsi = ref(false)
    // 如果跳转的是首页,修改他的keepAlive为true;
    onBeforeRouteLeave((to, from, next) => {
        // console.log(to, from)
        if(to.name === "Home"){
            to.meta.keepAlive = false;
        }
        next();
    })
    onBeforeRouteUpdate((to, from, next) => {
        console.log(to, from)
    })

    // 切换登录方式
    let loginWay = ref('password')
    let checkedPrivacy = ref(false)
    let wxLogin = reactive({
        show: false,
        url: "",
        loading: false
    })
    const loginFormRef = ref()
    function validateAccept(rule, value, callback) {
        if (!value) {
            callback(new Error())
        } else {
            callback()
        }
    }
    let disabled = ref(false)
    let login = reactive({
        form: {
            emailMobile: "",
            password: "",
            sms: "",
            privacy: false
        },
        rules: {
            emailMobile: [
                { required: true, message: '请输入手机号', trigger: ['blur', 'change'] }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: ['blur', 'change'] }
            ],
            sms: [
                { required: true, message: '请输入短信验证码', trigger: ['blur', 'change'] }
            ],
            privacy: [
                { validator: validateAccept, message: '请您仔细阅读 隐私协议 并接受', trigger: 'change' }
            ]
        },
    });

    // 短信验证码登录逻辑
    function startSms(){
        const data = {
            mobile: login.form.emailMobile
        }
        getSmsApi(data).then((res) => {
            if(res.code == 200){
                ElNotification.success('发送成功')
            }
        })
    }
    // 账号密码登录逻辑
    function onlogin(){
        const form = unref(loginFormRef);
        form.validate((valid) => {
            if(!valid) return false;
            if(disabled.value) return false;
            disabled.value = true;

            if(loginWay.value === 'password'){
                passwordLogin()
            }
            if(loginWay.value === 'sms'){
                smsLogin()
            }
        });
    }
    // 微信扫码登录逻辑
    let wxTimer = null
    function getWxQr(){
        getWxQrApi({
            origin: 'desktop'
        }).then((res) => {
            if(res.code === 200){
                wxLogin.show = true
                wxLogin.url = res.data.qr_img
                wxTimer = setInterval(() => {
                    refreshWx(res.data.random)
                }, 1500)
            }
        })
    }
    async function refreshWx(random){
        const res = await wxQrLoginApi({
            code: random
        })
        if(res.status_code === 200){

            wxLogin.show = false
            closeWxQr()
            loginCallBack(res)
        }
    }
    function closeWxQr(){
        clearInterval(wxTimer)
        wxTimer = null
    }

    async function passwordLogin(){
        const data = {
            mobile: login.form.emailMobile,
            password: login.form.password
        }
        const res = await loginApi(data)
        disabled.value = false
        if(res.status_code === 200){
            loginCallBack(res)
        }else{
            ElMessage({
                message: res.message || "系统繁忙",
                type: "error"
            })
        }
    }
    function smsLogin(){
        verifySmsApi({
            mobile: login.form.emailMobile,
            code: login.form.sms
        }).then((res) => {
            loginCallBack(res)
        })
    }

    let loginLoading = null
    function loginCallBack(res){
        ElNotification({
            message: '恭喜你，登录成功!',
            type: 'success'
        })
        loginLoading = ElLoading.service({
            lock: true,
            text: '正在登录...',
            background: 'rgba(0, 0, 0, 0.6)',
        })
        setToken(res.data.token)
        res.data.id = res.data.user_hash
        store.commit('user/SET_USER_INFO', res.data)
        ipcRendererInvoke('triggerSync')
        setTimeout(() => {
            router.replace({
                name: "Home"
            })
            loginLoading.close()
        },600)
    }

</script>
<script>
    let backUrl = ""
    export default {
        beforeRouteEnter(to, from, next) {
            backUrl = from.name
            next()
        }
    }
</script>

<style lang="scss">
    .dialog-text{
        // height: 400px;
        // overflow-y: auto;
        color: #333;
        font-size: 14px;
    }
    .loginForm{
        .el-button--primary{
            background: #44445f;
            border-color: #44445f;
        }

        .el-checkbox__input.is-checked .el-checkbox__inner{
            background: $purple;
            border-color: $purple;
        }
        .el-checkbox__input.is-checked + .el-checkbox__label{
            color: $purple;
        }
        .el-checkbox__label{
            line-height: 20px;
        }
    }
</style>
<style lang="scss" scoped>
    .container{
        display: flex;
        align-items: center;
        justify-content: center;
        height: 95vh;

        .loginForm{
            width: 300px;
            border-radius: 8px;
            padding: 30px 20px;

            .fangcun{
                display: block;
                margin: 0 auto 10px;
                cursor: pointer;
                width: 70px;
            }
            .fangcun-text{
                text-align: center;
                color: $purple2;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 20px;

            }

            .login-way{
                margin-top: 20px;
                p{
                    font-size: 12px;
                    cursor: pointer;
                    color: #999;
                }
                .noneAccount{
                    transition: all 0.5s;
                    &:hover{
                        color: #666;
                    }
                    font{
                        color: #4f5e9b;
                    }
                }
                .change{
                    &:hover{
                        color: $purple;
                    }
                }
            }
            .other-login-way{
                display: flex;
                align-items: center;
                justify-content: space-around;
                margin-top: 15px;
                p{
                    text-align: center;
                    color: #999999;
                    font-size: 12px;
                    cursor: pointer;
                    &:hover{
                        color: $purple;
                    }
                }
                .oauth-bg{
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background-color: #eeeeee;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    img{
                        height: 30px;
                        vertical-align: bottom;
                        cursor: pointer;
                    }
                }
            }
            .btn{
                display: block;
                margin: 30px auto 0;
                width: 300px;
                height: 40px;
                color: #fff;
                border-radius: 4px;
                background: #44445f;
            }
        }
        .userAgreement{
            display: flex;
            align-items: center;
            font-size: 14px;
            a{
                text-decoration: none;
                color: #4f5e9b;
                font-weight: 700;
                margin-left: 4px;
                vertical-align: middle;
                cursor: pointer;
            }
        }
    }
    .beian{
        color: #999;
        text-align: center;
        font-size: 14px;
        a{
            color: #999999;
            text-decoration: none;
            &:hover{
                color: #44445f;
            }
        }
    }
    .wx_img{
        width: 100%;
    }
</style>