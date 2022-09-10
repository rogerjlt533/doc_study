<template>
    <div class="container">
        <div class="center">
            <div class="back">
                <h3 @click="router.go(-1)"><font-awesome-icon icon="chevron-circle-left" style="font-size: 18px;margin-right: 4px;" color="#666666" />返回</h3>
            </div>
            <h3 class="text-center" id="price" style="color:#333;">选择适合你的笔记账户</h3>
            <ul class="price">
                <li style="width: 310px">
                    <div class="price-title">Free<span class="price-desc">注册即可</span></div>
                    <div class="price-num">¥<span>0</span></div>
                    <el-divider></el-divider>
                    <ul class="list">
                        <li>无限笔记数</li>
                        <li>笔记本数5</li>
                        <li>无限笔记引用</li>
                        <li>可加入团队笔记本</li>
                        <li>文件资源100M/月</li>
                        <li>无限标签索引</li>
                        <li>可微信录入笔记/图片</li>
                        <li>微信周通知</li>
                        <li>个性文本替换（10/个）</li>
                    </ul>
                </li>
                <li class="dart" style="width: 410px">
                    <div class="price-title">Pro<span class="price-desc">付费购买</span></div>
                    <div class="price-num">¥<span>69</span>/年</div>
                    <el-divider></el-divider>
                    <div class="flex justify-between">
                        <ul class="list">
                            <li>无限笔记数</li>
                            <li class="special">无限笔记本数</li>
                            <li>无限笔记引用</li>
                            <li>可加入团队笔记本</li>
                            <li class="special">可创建无限团队笔记本</li>
                            <li class="special">可生成全部笔记本的知识图谱</li>
                            <li class="special">文件资源500M/月</li>
                        </ul>
                        <ul class="list">
                            <li>无限标签索引</li>
                            <li>可微信录入笔记/图片</li>
                            <li class="special">个性文本替换（200/个）</li>
                            <li class="special">微信周通知, 周统计</li>
                            <li class="special">同步到Notion</li>
                            <li class="special">*图片无损无压缩保存</li>
                            <li class="develop">*笔记分享(开发中)</li>
                            <li class="develop">*生成个人blog(开发中)</li>
                            <li class="special">全部笔记历史&历史恢复</li>
                        </ul>
                    </div>
                    <el-divider></el-divider>
                    <div class="price-btn" @click="payFun('pro')">
                        选择PRO
                        <svg t="1637908085300" class="icon" style="vertical-align: bottom;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7658" width="24" height="24"><path class="svg" d="M873.1 596.2l-164-208A32 32 0 0 0 684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" p-id="7659" fill="#ffffff"></path></svg>
                    </div>
                </li>
            </ul>
            <div class="code">如果你拥有PRO会员兑换码，<span @click="showCode = true">点此兑换</span></div>
            <div class="code">如付费超过 24h，PRO 仍未激活，请微信联系：rogerunk 或邮箱联系：ivone@fang-cun.net</div>

            <el-dialog
                v-model="showCode"
                width="400px"
                :destroy-on-close="true"
                title="PRO会员兑换码"
            >
                <div class="pt20 pb20">
                    <div class="duihuan flex justify-center align-center">
                        <span class="font-16 text-weight7">兑换码：</span>
                        <el-input v-model='redemptionCode' size="small" class="mr10" style="width: 200px;"></el-input>
                        <el-button size="small" @click="redrmptionFun">兑换</el-button>
                    </div>
                    <div class="code-message">
                        <p class="error">{{errorMessage}}</p>
                    </div>
                </div>
            </el-dialog>
            <el-dialog
                v-model="showPayVip"
                width="650px"
                :destroy-on-close="true"
                title="会员服务"
                @close="closePay"
                :beforeClose="closePayBefore"
            >
                <div class="vip">
                    <h4>会员说明 <font style="color:red;">*</font></h4>
                    <p>由于本服务为虚拟服务，购前请仔细查看相关权益，一经售出概不支持退款或更换</p>
                    <div class="vip-pay">
                        <div class="order-info">
                            <h3>会员权限</h3>
                            <div class="flex align-center justify-between" >
                                <div class="pay-value" v-for="(item,index) in proPayValue" :key="index"
                                    :class="[item.checked ? 'actived-pay-value' : '']" 
                                    @click="selectPayValue(index)"
                                >
                                    <p style="font-size:14px;color:#999;">{{item.typeText}}{{item.label}}会员</p>
                                    <div class="value">
                                        <font>¥{{item.value}}</font>/{{item.label}}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="place-order" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.3)">
                            <div class="flex align-center">
                                <p class="mr10">购买数量: </p>
                                <el-input-number v-model="goodsNumber" :min="1" :max="100" size="small" @change="calculatePrice" />
                            </div>
                            <div class="xidan">
                                <font>¥{{priceNumber}}</font>
                                <button class="order-btn" @click="buy">立即下单</button>
                            </div>
                        </div>

                        <div class="pay-type" v-show="showPayCode">
                            <img :src="code_url" alt="">
                            <div class="pay-fangshi">
                                <p class="f-flex" :class="[activedWx ? ' actived-wx' : '']" @click="selectedWX">
                                    <svg t="1638280779630" class="icon mr10" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4060" width="30" height="30"><path d="M0 488.96v-30.72C2.56 430.08 7.68 404.48 15.36 378.88c20.48-66.56 53.76-122.88 99.84-171.52C179.2 138.24 256 94.72 340.48 66.56c48.64-15.36 97.28-23.04 145.92-25.6 40.96-2.56 79.36 0 120.32 7.68 33.28 5.12 64 12.8 97.28 25.6 79.36 28.16 148.48 71.68 207.36 133.12 7.68 7.68 12.8 15.36 20.48 23.04-2.56 0-2.56 2.56-5.12 2.56-20.48 10.24-40.96 20.48-61.44 28.16-143.36 66.56-286.72 133.12-430.08 197.12-28.16 12.8-56.32 10.24-81.92-5.12-20.48-12.8-38.4-25.6-58.88-38.4-12.8-10.24-25.6-17.92-40.96-28.16-12.8-7.68-20.48-2.56-20.48 12.8v2.56c2.56 12.8 5.12 25.6 10.24 38.4 25.6 61.44 51.2 120.32 76.8 181.76 7.68 17.92 20.48 25.6 35.84 23.04 10.24 0 20.48-2.56 28.16-7.68 30.72-15.36 58.88-33.28 87.04-51.2 156.16-92.16 309.76-184.32 465.92-276.48 10.24-7.68 23.04-12.8 33.28-20.48 0 2.56 2.56 2.56 2.56 5.12 5.12 10.24 10.24 17.92 12.8 28.16 28.16 61.44 40.96 125.44 35.84 192-2.56 28.16-7.68 56.32-15.36 84.48-17.92 61.44-48.64 115.2-92.16 163.84-51.2 56.32-115.2 99.84-184.32 128-40.96 15.36-81.92 28.16-122.88 35.84-28.16 5.12-56.32 7.68-81.92 7.68h-46.08c-20.48-2.56-40.96-2.56-58.88-5.12-30.72-5.12-61.44-12.8-89.6-23.04H322.56c-12.8 7.68-23.04 15.36-35.84 23.04-28.16 17.92-53.76 33.28-81.92 48.64-5.12 2.56-12.8 5.12-17.92 5.12s-10.24-2.56-10.24-10.24c0-5.12 0-12.8 2.56-17.92 5.12-38.4 12.8-74.24 20.48-112.64 0-5.12 0-7.68-5.12-10.24-15.36-12.8-30.72-23.04-46.08-38.4-51.2-46.08-92.16-102.4-117.76-166.4C20.48 599.04 12.8 568.32 7.68 537.6c-2.56-12.8-2.56-25.6-2.56-40.96-5.12 0-5.12-2.56-5.12-7.68z" :fill="activedWx ? '#6BCC03' : '#999999'" p-id="4061"></path></svg>
                                    微信支付
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </el-dialog>
            
        </div>
    </div>
</template>
<script>
import { ref, computed } from "vue";
import { useStore } from "vuex"
import { useRouter, onBeforeRouteLeave } from "vue-router"
import { getPayApi, verifyPayApi, redemptionCodeApi } from "@/api/user"
import { ElMessage, ElMessageBox, ElNotification } from "element-plus"

export default {
    name: "BuyPage",
    setup(props) {
        let store = useStore();
        let router = useRouter();
        let userRight = computed(() => store.state.user.userRight);
        let userInfo = computed(() => store.state.user.userInfo);

        let activedIndex = computed(() => {
            if(userRight.value?.is_pro){
                return 3
            }else if(!userRight.value?.is_pro && userRight.value?.is_edu){
                return 2
            }else{
                return 1
            }
        })

        let showPayVip = ref(false);
        let proPayValue = ref([])
        function payFun(type){
            if( type === "edu" && userRight.value?.is_pro === 1){
                ElMessageBox({
                    title: '提示',
                    message: "您已经是PRO会员了, 不可再购买EDU会员",
                    confirmButtonText: '确定',
                }).then(() => {}).catch(()=>{})
                return false;
            }
            if( type === "edu" && userInfo.value.bind_edu === 0){
                ElMessageBox({
                    title: '提示',
                    message: "您还未绑定教育邮箱，是否立即绑定？",
                    showCancelButton: true,
                    confirmButtonText: '去绑定',
                    cancelButtonText: '取消',
                }).then(() => {
                    router.push("/user")
                }).catch(()=>{})
                return false;
            }
            if(type == "pro"){
                proPayValue.value =  [
                    {
                        value: 69,
                        type: "1",
                        label: "年",
                        checked: true,
                        typeText: "PRO"
                    },
                    {
                        value: 8,
                        type: "3",
                        label: "月",
                        checked: false,
                        typeText: "PRO"
                    }
                ]
            }else if(type == "edu"){
                proPayValue.value =  [
                    {
                        value: 29,
                        type: "4",
                        label: "年",
                        checked: true,
                        typeText: "EDU"
                    }
                ]
            }
            calculatePrice();
            showPayVip.value = true;
        }

        
        let goodsNumber = ref(1);
        let priceNumber = ref(0);
        let activedObj = {
            goods_id: 1,
            goods_num: 1
        };

        /**
         *  1-pro年会员 3-pro月会员 4-edu年会员
         */
        function selectPayValue(index){
            proPayValue.value = proPayValue.value.map(item => {
                item.checked = false;
                return item;
            });
            proPayValue.value[index].checked = true;

            activedObj.goods_id = proPayValue.value[index].type;
            activedObj.goods_num = goodsNumber.value;
            calculatePrice();
        }

        // 计算价格
        function calculatePrice(){
            let value = 0;
            proPayValue.value.forEach((item) => {
                if(item.checked){
                    value = item.value
                }
            })
            activedObj.goods_num = goodsNumber.value;
            priceNumber.value = Number(goodsNumber.value) * Number(value);
        }

        // 选择支付方式
        let showPayCode = ref(false);
        let loading = ref(false)
        let activedWx = ref(true);
        function selectedWX(){
            activedWx.value = true;
        }
        let code_url = ref("")
        function buy(){
            if(priceNumber.value == 0){
                ElMessage.error("请选择要购买的会员类型")
                return false;
            }

            if(loading.value) return false;
            loading.value = true;
            let data = {
                goods: JSON.stringify([activedObj])
            };

            getPayApi(data).then((res) => {
                if(res.code == 200){
                    code_url.value = res.data.code_url
                }
                verifyPay(res.data.order_no)
                showPayCode.value = true;
                loading.value = false;
            })
        }

        // 检查订单是否完成支付
        let timer = null
        function verifyPay(order_no){
            timer = setInterval(() => {
                verifyPayApi({
                    order_no
                }).then((res) => {
                    if(res.code === 200 ){
                        clearInterval(timer)
                        ElNotification({
                            message: '支付成功!',
                            type: 'success'
                        })
                        router.replace({
                            path: "/user"
                        })
                    }
                })
            }, 1000)
        }

        function closePay(){
            clearInterval(timer)
            timer = null

            activedObj.goods_id = 1
            activedObj.goods_num = 1
            goodsNumber.value = 1
            priceNumber.value = 0
            showPayCode.value = false
        }
        function closePayBefore(done){
            if(!showPayCode.value){
                done()
                return false
            }
            ElMessageBox.confirm("您还未完成支付，确认关闭订单吗？",{
                type: "warning",
                confirmButtonText: "确认",
                cancelButtonText: "取消"
            }).then(() => {
                done()
            }).catch((err)=>{})
        }

        // 兑换码兑换
        let showCode = ref(false)
        let redemptionCode = ref('')
        let errorMessage = ref("")
        let codeDown = false
        function redrmptionFun(){
            if(!redemptionCode.value){
                errorMessage.value = "兑换码不能为空"
                return false
            }
            if(codeDown) return false
            codeDown = true
            const data = {
                code: redemptionCode.value
            }
            redemptionCodeApi(data).then((res) => {
                codeDown = false
                if(res.code == 200){
                    errorMessage.value = ''
                    showCode.value = false
                    ElNotification.success('兑换成功')
                }else{
                    errorMessage.value = res.message
                }
            })
        }

        onBeforeRouteLeave((to, from) => {
            clearInterval(timer)
        })

        return {
            router,
            showPayVip,
            payFun,
            userRight,
            activedIndex,
            proPayValue,
            goodsNumber,
            priceNumber,
            selectPayValue,
            calculatePrice,
            activedWx,
            selectedWX,
            buy,
            loading,
            code_url,
            showPayCode,
            showCode,
            redemptionCode,
            errorMessage,
            redrmptionFun,
            closePay,
            closePayBefore
        }
    }
}
</script>
<style lang="scss" scoped>
    *{
        text-decoration: none;
    }
    ul{
        padding: 0;
        li{
            list-style: none;
        }
    }
    .center{
        width: 900px;
        margin: 20px auto;
        background: #fff;
        border-radius: 4px;
        padding: 20px;
        .back{
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            > h3{
                display: inline-block;
                cursor: pointer;
                margin: 0;
                color: #333;
                cursor: pointer;
                &:hover{
                    color: $purple;
                    .svg-inline--fa{
                        color: $purple;
                    }
                }
            }
        }
    }
    .btn{
        width: 140px;
        height: 38px;
        background: $purple;
        color: #fff;
        border-radius: 4px;
    }
    .price{
        display: flex;
        justify-content: space-between;
        padding: 0;
        >li{
            padding: 20px 40px;
            background: #FAFAFC;
            border-radius: 6px;
            transition: all .5s;
            &:hover{
                box-shadow: 2px 2px 14px 0px rgba(0, 0, 0, .5);
            }
            .price-title{
                color: $purple2;
                font-weight: 700;
                font-size: 26px;
                .price-desc{
                    color: #999999;
                    font-size: 12px;
                    margin-left: 10px;
                }
            }
            .price-num{
                color: $purple2;
                font-size: 14px;
                margin: 10px 0;
                span{
                    font-size: 40px;
                    font-weight: 700;
                    margin-left: 6px;
                }
            }
            .list{
                font-size: 14px;
                line-height: 28px;
                color: #666;
            }
            .price-btn{
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #999;
                box-shadow: none;
                text-align: left;
                padding: 10px 0px;
                cursor: pointer;
                border-bottom: 1px solid $purple2;
                svg{
                    margin-left: 10px;
                }
            }
            .special{
                color: $purple;
            }
            .develop{
                color: $warning;
            }
        }
        .dart{
            background: $purple2;
            .price-title, .price-num, .list, .price-btn{
                color: #ffffff;
            }
            .price-btn:hover{
                border-bottom: 1px solid #999999;
            }
        }
    }

    .code{
        font-size: 14px;
        color: #666666;
        span{
            text-decoration: underline;
            cursor: pointer;
            &:hover{
                color: $purple;
            }
        }
    }
    .code-message{
        p{
            font-size: 12px;
            text-align: center;
        }
        .error{
            color: $error;
        }
        .success{
            color: $green;
        }
    }

    .vip{
        width: 600px;
        margin: 10px auto 40px;
        >h4{
            margin: 0px;
        }
        >p{
            color: #999;
            font-size: 14px;
        }
        .vip-pay{
            border: 1px solid #eee;
            padding: 20px 30px;
            .order-info{
                .pay-value{
                    width: 180px;
                    height: 60px;
                    border: 2px solid #eee;
                    border-radius: 4px;
                    padding: 10px 30px;
                    .value{
                        color: #999;
                        text-align: right;
                        font{
                            color: $purple;
                            font-size: 30px;
                            font-weight: 700;
                        }
                    }
                }
                .actived-pay-value{
                    border: 2px solid $purple;
                }
            }
            .place-order{
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 20px;
                padding: 20px 0;
                border-top: 1px dashed #eee;
                p{
                    color: #999;
                    font-size: 14px;
                }
                .xidan{
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    font{
                        display: block;
                        text-align: right;
                        font-size: 30px;
                        font-weight: 700;
                        color: $purple;
                        margin-right: 10px;
                    }
                    .order-btn{
                        display: block;
                        width: 100px;
                        height: 30px;
                        border-radius: 4px;
                        background: $purple;
                        border: 1px solid $purple;
                        color: #fff;
                        cursor: pointer;
                        &:hover{
                            box-shadow: 1px 1px 10px -4px rgba(0,0,0,.5);
                        }
                    }
                }
            }
            .pay-type{
                border-top: 1px solid #eee;
                padding-top: 20px;
                .pay-fangshi{
                    width: 100%;
                    p{
                        margin: 20px auto 0;
                        cursor: pointer;
                        position: relative;
                        width: 200px;
                        height: 40px;
                        font-size: 14px;
                        border-radius: 4px;
                        background: #fff;
                        justify-content: flex-start;
                        padding: 0 10px;
                        color: #999;
                        border: 1px solid #999;
                    }
                    .actived-wx{
                        color: #00c800;
                        border: 1px solid #00c800;
                    }
                }
                
                img{
                    display: block;
                    margin: 0 auto;
                    width: 150px;
                    height: 150px;
                    border: 2px solid #eee;
                }
            }
        }
    }
</style>