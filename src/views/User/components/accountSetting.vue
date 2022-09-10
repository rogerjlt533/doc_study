<template>
    <div class="account-set">
        <div class="user-info">
            <ul class="set-info">
                <li>
                    <span class="name" >头像</span>
                    <div class="header">
                        <div class="header-upload">
                            <img v-if="!userInfo.avatar" src="" alt="">
                            <img v-else :src="userInfo.avatar" alt="">
                        </div>
                    </div>
                    <div style="display: inline-block">
                        <el-upload
                                :action="api + '/api/user/upload'"
                                multiple
                                :limit="1"
                                :on-progress="uploadLoading"
                                :on-success="uploadSuccess"
                                :headers="uploadHeader"
                        >
                            <template #default>
                                <el-button type="primary" plain color="#7885d1" size="small">修改头像</el-button>
                            </template>
                        </el-upload>
                        <div style="width: 100px;" v-show="showProgress">
                            <el-progress :stroke-width="10" :percentage="progressNum"></el-progress>
                        </div>
                    </div>
                </li>
                <li>
                    <span class="name">昵称</span>
                    <span class="con">{{userInfo.name}}</span>
                    <el-button size="small" color="#7885d1" plain type="primary" @click="nameData.showName = true">修改</el-button>
                </li>
                <li v-if="userRight">
                    <span class="name">会员</span>
                    <span class="con" v-if="userRight.days > 0" style="width: 320px">
                        <proIcon :isPro="userRight.is_pro" :isEdu="userRight.is_edu" />
                        剩<span style="color:#7885d1">{{userRight.days}}</span>天。到期时间
                        <span style="color:#7885d1">{{userRight.end_time}}</span>
                        <router-link class="xufei ml10" to="/BuyPage">续费</router-link>
                    </span>
                    <span class="con" v-else>
                        未开通会员，<router-link class="xufei" to="/BuyPage">立即续费</router-link>
                    </span>
                </li>
                <li>
                    <span class="name">手机号</span>
                    <span class="con">{{userInfo.mobile}}</span>
                    <el-button size="small" color="#7885d1" plain type="primary" @click="bindMobile">更换手机</el-button>
                </li>
                <li>
                    <span class="name">邮箱</span>
                    <span class="con">{{userInfo.email}} <font style="color: #F56C6C;font-size:12px">{{userInfo.email_is_check == 1 ? '' : '未验证'}}</font> </span>
                    <el-button size="small" type="primary" plain color="#7885d1" @click="bindEmail">{{userInfo.email_is_check == 1 ? "绑定邮箱": "修改邮箱"}}</el-button>
                </li>
                <li>
                    <span class="name">微信</span>
                    <template v-if="userInfo.wx_is_bind == 1">
                        <span class="con">已绑定</span>
                    </template>
                    <template v-else>
                        <span class="con error">未绑定</span>
                        <el-button class="color-white" size="small" type="primary" color="#7885d1" @click="addWechat">添加微信</el-button>
                    </template>
                </li>
                <li>
                    <el-button class="color-white" type="primary" color="#7885d1" @click="resetPassword">修改密码</el-button>
                </li>
            </ul>
        </div>

        <!-- 修改昵称 -->
        <el-dialog title="修改昵称" center width="300px"
                   v-model="nameData.showName"
                   :close-on-click-modal="false"
                   :close-on-press-escape="false"
                   :show-close="false"
        >
            <el-form ref="nameFormRef" :model="nameData.form" :rules="nameData.rule" label-width="100" label-position="top">
                <el-form-item label="" prop="name">
                    <el-input v-model="nameData.form.name" autocomplete="off" size="small" placeholder="请输入昵称"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
            <span class="dialog-footer">
                <el-button size="small" @click="nameData.showName = false">取 消</el-button>
                <el-button type="primary" size="small" @click="sureName">确 定</el-button>
            </span>
            </template>
        </el-dialog>

        <!-- 绑定邮箱 -->
        <el-dialog title="绑定邮箱" center width="300px"
                   v-model="emailData.showEmail"
                   :close-on-click-modal="false"
                   :close-on-press-escape="false"
                   :show-close="false"
        >
            <el-form ref="emailFormRef" :model="emailData.form" :rules="emailData.rules" label-width="100" label-position="top">
                <el-form-item label="输入邮箱" prop="email_address">
                    <el-input v-model="emailData.form.email_address" autocomplete="off" size="small"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
            <span class="dialog-footer">
                <el-button size="small" @click="emailData.showEmail = false">取 消</el-button>
                <el-button type="primary" size="small" @click="sureEmail">确 定</el-button>
            </span>
            </template>
        </el-dialog>

        <!-- 绑定手机号 -->
        <el-dialog title="绑定手机" center width="300px"
                   v-model="mobileData.showMobile"
                   :close-on-click-modal="false"
                   :close-on-press-escape="false"
                   :show-close="false"
        >
            <el-form ref="mobileFormRef" :model="mobileData.form" :rules="mobileData.rules" label-width="100" label-position="top">
                <el-form-item label="输入手机号" prop="mobile">
                    <el-input v-model="mobileData.form.mobile" autocomplete="off" size="small"></el-input>
                </el-form-item>
                <el-form-item label="验证码" prop="code">
                    <el-input v-model="mobileData.form.code" autocomplete="off" size="small" class="mr10" style="width:160px;"></el-input>
                    <fc-code :value="mobileData.form.mobile" @start="startSms"></fc-code>
                </el-form-item>
            </el-form>
            <template #footer>
            <span class="dialog-footer">
                <el-button @click="mobileData.showMobile = false" size="small">取 消</el-button>
                <el-button type="primary" @click="sureMobile" size="small">确 定</el-button>
            </span>
            </template>
        </el-dialog>

        <!-- 绑定微信二维码 -->
        <el-dialog title="绑定微信" center width="250px"
                   v-model="showQr"
                   :close-on-click-modal="false"
        >
            <p>扫描二维码关注公众号绑定微信</p>
            <el-image
                    :src="wechatQr"
                    fit="cover"
            ></el-image>
        </el-dialog>

        <!-- 重置密码二维码 -->
        <el-dialog title="修改密码" center width="250px"
                   v-model="showResetQr"
                   :close-on-click-modal="false"
        >
            <p>为了您的账户安全，请用微信扫码获取重置密码链接。</p>
            <el-image
                    :src="resetQr"
                    fit="cover"
            ></el-image>
        </el-dialog>
    </div>
</template>

<script setup>
    import { ref, defineProps, reactive, unref, toRefs, watch } from "vue"
    import { setNameApi, setAvatarApi, checkMobileApi, verifyEmailApi, bindWechatApi, resetPasswordApi, verifyBindWXApi, verifyMobileApi } from "@/api/user"
    import { getToken } from "@/utils/auth"
    // 引入组件
    import proIcon from "@/components/element/proIcon.vue"
    import fcCode from "@/components/element/fc-code.vue"
    import {ElMessage, ElNotification} from "element-plus";


    const api = process.env.VUE_APP_URL;
    const props = defineProps({
        userInfo: {
            type: Object,
            default: {}
        },
        userRight: {
            type: Object,
            default: {}
        }
    })
    const { userInfo, userRight } = toRefs(props)

    // 图片上传 ---------- start -----
    let uploadHeader = {
        hk: getToken()
    }
    function uploadSuccess(response){
        if(response.code == 200){
            showProgress.value = false;
            if(response.data.file){
                userInfo.value.avatar = response.data.file;
                saveAvatar(response.data.path)
            }
        }
    }
    function saveAvatar(url){
        setAvatarApi({
            avatar: url
        }).then((res) => {
            if(res.code == 200){
                ElMessage.success({
                    message: '设置成功！'
                });
            }
        })
    }
    // 图片上传进度展示
    let progressNum = ref(0);
    let showProgress = ref(false);
    function uploadLoading(event) {
        showProgress.value = true;
        progressNum.value = parseInt(event.percent);
    }
    // 图片上传 ---------- end ------

    // 设值昵称 ---------- start -----
    let nameFormRef = ref(null);
    let nameData = reactive({
        showName: false,
        form: {
            name: userInfo.value.name
        },
        rule: {
            name: [
                { required: true, message: '请输入昵称', trigger: ['blur', 'change'] }
            ]
        }
    })
    function sureName(){
        let form = unref(nameFormRef);
        form.validate((valid) => {
            if(!valid) return false;
            setNameApi({
                name: nameData.form.name
            }).then((res) => {
                console.log(res);
                if(res.code == "200"){
                    userInfo.value.name = nameData.form.name;
                    ElMessage.success({
                        message: '设置成功！'
                    });
                    nameData.showName = false;
                }
            })
        });
    }
    // 设值昵称 ---------- end -------

    // 绑定邮箱 ---------- start -----
    const checkEmail = (rule, value, callback) => {
        let emailRule = /^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.).*$/;
        if(value){
            if(emailRule.test(value)){
                callback();
            }else{
                callback(new Error('请输入正确的邮箱地址'));
            }
        }else{
            callback(new Error('请输入邮箱地址'));
        }
    };
    let emailData = reactive({
        showEmail: false,
        form: {
            email_address: "",
        },
        rules: {
            email_address: [
                { required: true, validator: checkEmail, trigger: ['blur', 'change'] }
            ]
        },
    })
    function bindEmail(){
        emailData.showEmail = true
    }
    let emailFormRef = ref(null);
    function sureEmail(){
        const form = unref(emailFormRef);
        form.validate((valid) => {
            if(!valid) return false;
            verifyEmailApi({
                email_address: emailData.form.email_address
            }).then((res) => {
                if(res.code == 200){
                    ElMessage.success({
                        message: '验证信息已发送到邮箱,请登录邮箱进行验证操作!'
                    });
                    emailData.showEmail = false;
                }
            })
        });
    }
    // 绑定邮箱 ---------- end -----

    // 绑定手机 ---------- start -----
    let mobileRef = ref(null);
    const checkMobile = (rule, value, callback) => {
        let phoneRule = /^1(3[0-9]|4[5,7]|5[0,1,2,3,5,6,7,8,9]|6[2,5,6,7]|7[0,1,7,8]|8[0-9]|9[1,8,9])\d{8}$/;
        if(value){
            if(phoneRule.test(value)){
                callback();
                mobileRef.value.btnStatus = "primary"
            }else{
                callback(new Error('请输入正确的手机号'));
                mobileRef.value.btnStatus = "info"
            }
        }else{
            callback(new Error('请输入手机号码'));
            mobileRef.value.btnStatus = "info"
        }
    };
    let mobileData = reactive({
        showMobile: false,
        form: {
            mobile: "",
            code: ""
        },
        rules: {
            mobile: [
                { required: true, validator: checkMobile, trigger: ['blur', 'change'] }
            ],
            code: [
                { required: true, message: '请输入验证码', trigger: ['blur', 'change'] }
            ]
        }
    })
    let mobileFormRef = ref(null);
    function bindMobile(){
        mobileData.showMobile = true
    }

    // 获取手机短信验证码
    function startSms(){
        const data = {
            mobile: mobileData.form.mobile
        }
        verifyMobileApi(data).then((res) => {
            if(res.code == 200){
                ElNotification.success('发送成功')
            }else{
                ElMessage.warning(res.message || '系统繁忙，请稍后重试')
            }
        })
    }

    function sureMobile(){
        const form = unref(mobileFormRef);
        form.validate((valid) => {
            if(!valid) return false;
            checkMobileApi({
                code: mobileData.form.code,
                mobile: mobileData.form.mobile
            }).then((res) => {
                console.log(res);
                if(res.code == 200){
                    ElMessage.success("设置成功!");
                    mobileData.showMobile = false;
                }
            })
        });
    }

    // 绑定手机 ---------- end -----

    // 绑定微信 ---------- start -----
    let wechatQr = ref("")
    let showQr = ref(false)
    let bindWxTimer
    function addWechat(){
        bindWechatApi().then(async (res) => {
            if(res.code == 200){
                showQr.value = true;
                wechatQr.value = res.data.qr_img

                bindWxTimer = setInterval(async () => {
                    let bindRes = await verifyBindWX()
                    if(bindRes){
                        clearInterval(bindWxTimer)
                        showQr.value = false
                        ElMessage.success("微信绑定成功")
                        userInfo.value.wx_is_bind = 1
                    }
                },1000)
            }
        })
    }
    watch(() => showQr.value, (value) => {
        if(!value) clearInterval(bindWxTimer)
    })
    // 轮询检查是否绑定了微信
    function verifyBindWX(){
        return new Promise((resolve, reject) => {
            verifyBindWXApi().then((res) => {
                console.log(res)
                if(res.code == 200){
                    resolve(res.data[0].is_bind)
                }else{
                    resolve(false)
                }
            }).catch(err => {
                reject(false)
            })
        })
    }

    // 绑定微信 ---------- end -----

    // 修改密码，获取重置密码的二维码
    let resetQr = ref("");
    let showResetQr = ref(false)
    function resetPassword(){
        resetPasswordApi().then((res) => {
            if(res.code == 200){
                showResetQr.value = true;
                resetQr.value = res.data.qr_img;
            }
        })
    }
</script>

<style lang="scss" scoped>
    ul{
        list-style: none;
    }
    .account-set{
        .user-info{
            .set-info{
                li{
                    min-height: 50px;
                    .name{
                        display: inline-block;
                        width: 100px;
                        color: #333;
                        font-size: 14px;
                    }
                    .con{
                        display: inline-block;
                        width: 260px;
                        color: #999;
                        font-size: 14px;
                        .xufei{
                            cursor: pointer;
                            color: $purple;
                            &:hover{
                                opacity: 0.8;
                            }
                        }
                    }
                    .tishi{
                        display: inline-block;
                        color: #F03957;
                        font-size: 14px;
                        margin-left: 10px;
                    }
                }
            }
        }
        .header{
            display: inline-block;
            width: 260px;
            vertical-align: middle;
            margin-bottom: 20px;
            .header-upload{
                width: 100px;
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border-radius: 10px;
                border: 4px  solid #fff;
                box-shadow: 0px 0px 10px -4px rgba($color: #000000, $alpha: 0.5);
                img{
                    width: 100%;
                }
            }
        }
    }
</style>