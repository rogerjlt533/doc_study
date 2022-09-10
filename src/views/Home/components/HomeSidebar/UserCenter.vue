<template>
    <div class="header-user">
        <img class="avatar" :src="userInfo.avatar" alt="">
        <div class="nickname ml10">
            <div class="name-top mb6 unselectable">
                <span class="name line-1">{{userInfo.name}}</span>
                <el-dropdown trigger="click">
                    <font-awesome-icon icon="sliders-h" style="font-size: 18px;cursor: pointer;" color="#9EA0AD" />
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="goSet()"> ⚙️ 账户信息</el-dropdown-item>
                            <el-dropdown-item @click="goHelp()"> 🤝 帮助中心</el-dropdown-item>
                            <el-dropdown-item @click="mobileUse">📱 手机使用</el-dropdown-item>
                            <el-dropdown-item @click="showWxQun = true"> 💬 加入社群</el-dropdown-item>
                            <el-dropdown-item @click="showFeedback = true"> 🔖 意见反馈</el-dropdown-item>
                            <div class="delete">
                                <el-dropdown-item divided @click="signOut()"> 🏃 注销登入</el-dropdown-item>
                            </div>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <div class="remind ml6" @click="seeNotice">
					<span class="sign" v-show="isNotice !== -1"></span>
					<font-awesome-icon icon="bell" style="font-size: 18px;" color="#9EA0AD" />
				</div>
            </div>
            <div class="user-vip">
                <proIcon @click="goPro" :isPro="userRight?.is_pro" :isEdu="userRight?.is_edu" />
                <img v-if="showDaka" src="@/assets/icon/gift.png" alt="gift" style="float: right;width:22px;cursor:pointer" @click="showClock = true">
            </div> 
        </div>
    </div>

    <!-- 加入社群弹窗 -->
	<el-dialog title="共建微信群" center width="250px" 
		v-model="showWxQun"
	>
		<img style="width: 100%" src="@/assets/image/wxqun.png" alt="">
    </el-dialog>
    <!-- 手机使用二维码-->
    <el-dialog title="手机使用" center width="250px"
        v-model="showMobileUse"
    >
        <div class="H5Qr">
            <p class="text-center font-14 color-9">请使用手机扫描二维码体验，或者，你可以先<a class="color-purple" href="https://help.fangcun.in/help/h5.html" target="_blank">了解如何使用</a ></p>
            <img style="width: 100%" src="https://stor-assets.fang-cun.net/h5_qr.png" alt="">
        </div>
    </el-dialog>
    <!-- 意见反馈 -->
    <el-dialog title="意见反馈" center width="350px"
        v-model="showFeedback"
        @close="closeFeedback"
        destroy-on-close
    >
        <div class="feedback pt10 pl10 pr10 pb10" v-show="feedback.show">
            <el-form
                ref="formRef"
                :model="feedback"
            >
                <el-form-item
                    prop="content" required
                    :rules="[{ required: true, message: '意见反馈内容不能为空' }]"
                >
                    <el-input v-model="feedback.content" type="textarea" resize="none" rows="4" placeholder="请输入你的意见反馈内容"></el-input>
                </el-form-item>
                <el-form-item
                    prop="email"
                    :rules="[{ validator: validateEmail, message: '邮箱格式不正确'}]"
                >
                    <div class="mt10">
                        <div class="f-flex">
                            <span style="width: 100px;">邮箱地址：</span>
                            <el-input v-model="feedback.email" type="text" size="small"></el-input>
                        </div>
                        <p class="font-12 color-9" style="line-height: 22px">非必填项。如果你填写，我们会通过邮件跟你取得联系</p>
                    </div>
                </el-form-item>
            </el-form>
            <el-button class="margin-center text-center mt20" size="small" type="primary" color="#7885d1" @click="submitFeedback">提交</el-button>
        </div>

        <div v-show="!feedback.show" class="feedback-result pt10 pl10 pr10 pb10">
            <div class="loader"></div>
            <p>感谢您的意见反馈，我们会尽快给您回复~</p>
            <el-button class="margin-center text-center mt20" size="small" type="primary" color="#cccccc" @click="showFeedback = false">关闭</el-button>
        </div>
    </el-dialog>

    <!-- 月打卡活动 -->
    <div class="clock-ka">
        <el-dialog
            v-model="showClock"
            width="450px"
            :show-close="false"
            destroy-on-close
        >
            <div class="clock-box">
                <calendarCom></calendarCom>
            </div>
        </el-dialog>
    </div>
    
</template>
<script setup>
import {ref, onMounted, computed, reactive, unref} from "vue"
	import { useStore } from "vuex"
	import { useRouter } from 'vue-router'
    import { removeToken } from "@/utils/auth"
    import bus from '@/utils/bus'
    import {userFeedbackApi} from "@/api/user"
    // 组件
    import proIcon from "@/components/element/proIcon.vue"
    import calendarCom from "@/components/element/calendarCom.vue"
    import {ElMessage, ElMessageBox} from "element-plus";


    const store = useStore();
    const router = useRouter();

    let userInfo = computed(() => { return store.state.user.userInfo });
    let userRight = computed(() => { return store.state.user.userRight });

    let showOptions = ref(false)
    let showWxQun = ref(false)
    let showClock = ref(false)
    let showFeedback = ref(false)
    let feedback = reactive({
        content: '',
        email: '',
        show: true
    })
    const validateEmail = (rule, value, callback) => {
        if (value) {
            let emailRule = /^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.).*$/;
            if(emailRule.test(value)){
                callback()
            }else{
                callback(new Error('请输入正确的邮箱地址'));
            }
        }else{
            callback()
        }
    }

    // 用户打卡活动
    let showDaka = ref(true)
    let nowDate = new Date().getTime()
    let fanishTime = 1654012799000
    if(nowDate > fanishTime){
        showDaka.value = false
    }

    // 退出
    function signOut(){
        ElMessageBox.confirm('确定要退出吗？🥺', {
            type: "warning",
            confirmButtonText: "退出",
            cancelButtonText: "取消"
        }).then(()=>{
            store.commit("CLEAR_VUEX") // 清理vuex中的数据
            showOptions.value = false
            removeToken()
            localStorage.removeItem("vuex")
            router.push({
                path: "/Login"
            })
        }).catch(()=>{})
    }
    // 帮助
    function goHelp(){
        showOptions.value = false;
        window.open("https://help.fangcun.in/help/note.html")
    }
    // 手机使用
    let showMobileUse = ref(false)
    function mobileUse(){
        showMobileUse.value = true
    }
    // 设置
    function goSet(){
        showOptions.value = false;
        router.push({
            path: "/user"
        });
    }
    // 意见反馈
    let formRef = ref(null)
    function submitFeedback(){
        const form = unref(formRef)
        form.validate( async (valid) => {
            if(!valid) return false
            const res = await userFeedbackApi({
                content: feedback.content,
                email: feedback.email
            })
            if(res.code === 200){
                feedback.show = false
            }
        })
    }
    function closeFeedback(){
        feedback.content = ''
        feedback.email = ''
        feedback.show = true
    }

    // 查看通知消息
    function seeNotice(){
        store.commit("user/SHOW_NOTICE",{data: true})
    }
    let noticeList = computed(() => {
		return store.state.user.noticeList
	});
    let isNotice = ref(-1)
   
    bus.on("checkNoReading",() => {
        checkNoRead();
    })

    function checkNoRead(){
        isNotice.value = noticeList.value.findIndex((item, index, arr) => {
            return item.read_status == 0;
        })
    }

    function goPro(){
        router.push({
            path: '/BuyPage'
        })
    }

   
    // 获取用户基础信息
    onMounted(() => {
        store.dispatch("user/getUserRight");
        // store.dispatch("user/getUserInfo");
        checkNoRead();
    })

</script>
<style lang="scss">
    .el-dropdown-menu__item{
        a{
            text-decoration: none;
            color: #666;
            &:hover{
                color: $purple;
            }
        }
    }
</style>
<style lang="scss" scoped>
    .clock-ka{
        ::v-deep(.el-dialog__header){
            padding: 0 !important;
            border: 0 !important;
        }
    }

    .header-user{
        display: flex;
        align-items: center;
        width: 240px;
        padding: 10px;
        border-bottom: 1px solid #eee;

        .avatar{
            width: 60px;
            height: 60px;
            border-radius: 10px;
            border: 4px solid #fff;
            box-shadow: 2px 2px 10px -4px rgb(0 0 0 / 50%)
        }

        .nickname{
            .name-top{
                display: flex;
                align-items: center;
                .el-icon-message-solid{
                    color: #999;
                    font-size: 20px;
                    cursor: pointer;
                }
                .name{
                    font-size: 18px;
                    font-weight: 700;
                    display: block;
                    width: 110px;
                }
                .remind{
					position: relative;
					cursor: pointer;
					.sign{
						position: absolute;
						top: 0;
						right: -2px;
						display: inline-block;
						width: 8px;
						height: 8px;
						border-radius: 50%;
						background: red;
					}
					i{
						color: #999;
						font-size: 20px;
					}
				}

            }
            .user-vip{
                display: flex;
                align-items: center;
                justify-content: space-between;
                img{
                    width: 50px;
                }
                span{
                    font-size: 18px;
                    cursor: pointer;
                }
            }
        }
        .option{
            cursor: pointer;
            i{
                color: #999;
                font-size: 20px;
            }
        }
    }
</style>

<style>
.feedback-result p{
    text-align: center;
    color: #A5DC86;
    font-size: 14px;
    margin-top: 10px;
}
/*圆圈效果*/
.loader {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto;
    border-radius: 50%;
    border: 4px solid rgba(165, 220, 134, 0.2);
    /*border-left-color: #A5DC86;*/
    /*animation: animation_collect 1s linear 1 both;*/
}

@keyframes animation_collect {
    0% {
        transform: rotate(270deg);
        border-left-color: #A5DC86;
    }
    25%  {
        border-left-color: #A5DC86;
    }
    50%  {
        border-left-color: #A5DC86;
    }
    75%  {
        border-left-color: #A5DC86;
    }
    100% {
        border-left-color: rgba(165, 220, 134, 0.2);
        transform: rotate(0deg);
    }
}

.loader::before {
    position: absolute;
    content: '';
    top: 50%;
    left: 15px;
    border: 4px solid #A5DC86;
    border-left-width: 0;
    border-bottom-width: 0;
    transform: scaleX(-1) rotate(135deg);
    transform-origin: left top;
    animation: animation_true 0.5s linear 1 both;
    opacity: 0;
}

@keyframes animation_true {
    0% {
        opacity: 0;
        width: 0px;
        height: 0px;
    }
    33%  {
        opacity: 1;
        width: 20px;
        height: 0px;
    }
    100% {
        opacity: 1;
        width: 20px;
        height: 40px;
    }
}
</style>
