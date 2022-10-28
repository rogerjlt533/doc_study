<template>
    <div class="container">
        <div class="loginForm">
            <img class="fangcun" src="@/assets/image/fangcun.png" alt="">
            <el-form ref="registerFormRef" :model="registerForm" :rules="rules" label-width="0">
                <el-form-item label="" prop="emailMobile">
                    <el-input v-model="registerForm.emailMobile" size="medium" placeholder="请输入手机号"></el-input>
                </el-form-item>
                <el-form-item label="" prop="code" v-show="isMobile">
                    <div class="verify-box">
                        <el-input v-model="registerForm.code" autocomplete="off" placeholder="请输入验证码" class="mr10" style="width:190px;"></el-input>
                        <fc-code :value="registerForm.emailMobile" @start="startSms"></fc-code>
                    </div>
                </el-form-item>
                <el-form-item label="" prop="password">
                    <el-input type="password" v-model="registerForm.password" size="medium" placeholder="请设置账户密码"></el-input>
                </el-form-item>
                <el-form-item label="" prop="user_name">
                    <el-input v-model="registerForm.user_name" size="medium" placeholder="请设置用户名"></el-input>
                </el-form-item>
                <el-form-item label="" prop="privacy">
                    <div class="userAgreement">
                        <el-checkbox v-model="registerForm.privacy" label="我已阅读并接受"></el-checkbox>
                        <a @click="showYinsi = true"> 隐私协议</a>
                    </div>
                </el-form-item>
            </el-form>
            <button class="water-ripple-btn btn"
                    @click="signUp()"
                    v-loading="disabled"
                    element-loading-background="rgba(0, 0, 0, 0.8)"
            >注册，免费领取7天pro🎉</button>

            <div class="other-login-way">
                <p class="noneAccount" @click="router.replace({name:'Login'})">已有账号, <font>马上登录</font></p>
                <div class="oauth-bg unselectable" @click="getWxQr" v-if='false'>
                    <img data-v-14de1f73="" title="微信" alt="微信" src="@/assets/svgPath/wx.svg" class="oauth-btn">
                    <span class="font-12">微信注册</span>
                </div>
            </div>
        </div>
    </div>

    <div class="beian">ICP备案证书号: <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鲁ICP备2021030472号-1</a> POWERED BY方寸笔迹®</div>

    <el-dialog title="隐私协议" v-model="showYinsi" width="50%" center>
        <el-scrollbar height="400px">
            <div class="dialog-text">
                <pre style="white-space: pre-wrap;word-wrap: break-word;">{{text}}</pre>
            </div>
        </el-scrollbar>
    </el-dialog>

    <el-dialog title="微信扫码注册" v-model="wxRegister.show" width="300px" center @close="closeWxQr">
        <p class="text-center font-14">扫码关注公众号后自动注册成功</p>
        <img class="wx_img" :src="wxRegister.url" alt="">
    </el-dialog>
</template>
<script setup>
    import { reactive, ref, unref } from "vue"
    import { useRouter } from 'vue-router'
    import { useStore } from "vuex"
    import { registerApi, registerSmsApi, registerWxApi, verifyRegisterWxApi } from "@/api/user"
    import { initUserInfoApi, loginApi } from '@/apiDesktop/user'
    import { setToken, encryption } from "@/utils/auth"
    import text from "@/assets/js/yinsixieyi.js"
    import { ElNotification, ElMessage } from "element-plus"
    import fcCode from "@/components/element/fc-code.vue";

    const router = useRouter()
    const store = useStore()

    let showYinsi = ref(false);
    // 手机号绑定
    let isMobile = ref(true);
    const checkAccount = (rule, value, callback) => {
        let rule1 = /^[0-9]*$/;
        let phoneRule = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])\d{8}$/;
        let emailRule = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;

        if(value){
            if(phoneRule.test(value)){
                callback();
            }else{
                callback(new Error('请输入正确的手机号'));
            }
        }else{
            callback(new Error('请输入手机号'));
        }
    };
    const checkCode = (rule, value, callback) => {
        if(isMobile.value){
            if(value){
                callback();
            }else{
                callback(new Error('请输入手机验证码'));
            }
        }else{
            callback();
        }
    }
    //注册逻辑
    const registerFormRef = ref();
    function validateAccept(rule, value, callback) {
        console.log(value);
        if (!value) {
            callback(new Error());
        } else {
            callback();
        }
    }
    let disabled = ref(false);
    let registerForm = reactive({
        emailMobile: "",
        user_name: "",
        password: "",
        code: "",
        privacy: false
    })
    let rules = {
        emailMobile: [
            { required: true, validator: checkAccount, trigger: ['blur', 'change'] }
        ],
        user_name: [
            { required: true,  message: '请输入账号', trigger: ['blur', 'change'] }
        ],
        password: [
            { required: true, message: '请输入密码', trigger: ['blur', 'change'] }
        ],
        code: [
            { required: true, validator: checkCode, trigger: ['blur', 'change'] }
        ],
        privacy: [
            { validator: validateAccept, message: '请您仔细阅读 隐私协议 并接受', trigger: 'change' }
        ]
    }

    // 获取手机号验证码
    function startSms(){
        const data = {
            mobile: registerForm.emailMobile
        }
        registerSmsApi(data).then((res) => {
            if(res.code === 200){
                ElNotification.success('发送成功')
            }else{
                ElMessage.warning(res.message || '系统繁忙，请稍后重试')
            }
        })
    }
    // 手机号注册
    function signUp(){
        const forms = unref(registerFormRef);
        forms.validate((valid) => {
            if(!valid) return false;
            if(disabled.value) return false;
            disabled.value = true;

            registerApi({
                mobile: registerForm.emailMobile,
                user_name: registerForm.user_name,
                sms_code: isMobile.value ? registerForm.code : "",
                password: encryption(registerForm.password)
            }).then((res) => {
                setTimeout(() => {
                    disabled.value = false
                    passwordLogin()
                }, 3000)
                // registerCallBack(res)
            })
        });
    }

    // 微信注册部分
    let wxRegister = reactive({
        show: false,
        url: ''
    })
    let wxTimer = null
    const getWxQr = () => {
        registerWxApi().then((res) => {
            if(res.code === 200){
                wxRegister.show = true
                wxRegister.url = res.data.qr_img
                wxTimer = setInterval(() => {
                    refreshWx(res.data.random)
                }, 1000)
            }
        })
    }
    const refreshWx = (random) => {
        verifyRegisterWxApi({
            qr_random: random
        }).then(res => {
            console.log(res)
            if(res.code === 200){
                closeWxQr()
                registerCallBack(res)
            }
        })
    }
    function closeWxQr(){
        clearInterval(wxTimer)
        wxTimer = null
    }

    async function passwordLogin(){
        console.log(registerForm)
        const data = {
            mobile: registerForm.emailMobile,
            password: registerForm.password
        }
        const res = await loginApi(data)
        if(res.status_code === 200){
            await registerCallBack(res)
        }else{
            ElMessage({
                message: res.message || "系统繁忙",
                type: "error"
            })
        }
    }

    // 注册成功的回调函数
    async function registerCallBack(res){
        ElNotification({
            message: '恭喜你，注册成功！',
            type: 'success'
        });
        setToken(res.data.token)
        res.data.id = res.data.user_hash
        store.commit('user/SET_USER_INFO', res.data)
        setTimeout(() => {
            router.replace({
                name: "Home"
            })
        },1000)
        console.log('result', res)
        const result = await initUserInfoApi({
            token: res.data.token
        })
        console.log('result', result)
    }



</script>
<style lang="scss">
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
                margin: 0 auto;
                margin-bottom: 14px;
                cursor: pointer;
                width: 60px;
            }
            .verify-box{
                display: flex;
                align-items: center;
            }
            .noneAccount{
                color: #999;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.5s;
                text-align: left;
                &:hover{
                    color: #666;
                }
                font{
                    color: #4f5e9b;
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
    }
    .beian{
        color: #999;
        text-align: center;
        font-size: 14px;
        a{
            color: #999;
            text-decoration: none;
            &:hover{
                color: #44445f;
            }
        }
    }

    .other-login-way{
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 15px;
        .oauth-bg{
            height: 30px;
            padding: 0 10px;
            border-radius: 45px;
            background-color: #eeeeee;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            img{
                height: 24px;
                vertical-align: bottom;
                margin-right: 4px;
            }
            span{
                color: #999999;
            }
        }
    }
    .wx_img{
        width: 100%;
    }

</style>