<template>
    <div class="calendar-com">
        <div class="calendar">
            <h3>您已累积签到{{count}}天</h3>

            <el-popover
                    placement="bottom"
                    :width="200"
                    trigger="hover"
            >
                <template #reference>
                    <el-button type='text' style="float: right;color:#999;font-weight:400;">签到说明</el-button>
                </template>
                <div class="instruction">
                    <div class="xuzhi">
                        <span>活动时间</span>
                        <p class="tiaojian">{{timeRange}}</p>
                    </div>
                    <div class="xuzhi">
                        <span>签到条件</span>
                        <p class="tiaojian">使用方寸笔迹记录的笔记文字超出20字，即算是当天签到成功。</p>
                    </div>
                    <div class="xuzhi">
                        <span>用户需知</span>
                        <p>1. 无需报名，所有注册用户均可参加。</p>
                        <p>2. 用户参与活动之后，礼品是在活动期间由用户主动发起领取。</p>
                        <p>3. 用户需在活动期间领取对应的礼品，超出期限暂无法兑换。</p>
                        <p>4. 年付会员折扣券，使用时间截止到2022-05-31。</p>
                        <p>5. 实物礼品我们会在活动结束后统一发放，发放后会通过公众号进行通知。</p>
                    </div>
                </div>
            </el-popover>
            <table>
                <thead>
                <th v-for="(week,weeki) in weekList" :key="weeki">{{week.label}}</th>
                </thead>
                <tbody>
                <tr v-for="(date,index) in dateList" :key="index">
                    <td
                            :class="[k.usage_calendar == 1 ? 'usage_calendar' : '']"
                            v-for="k in date" :key="k.date"
                    >
                        <svg v-if="k.day" t="1640248222926" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2031" width="24" height="24"><path d="M512 170.666667a341.333333 341.333333 0 0 0-290.133333 521.216 42.666667 42.666667 0 0 1-72.533334 45.013333A424.874667 424.874667 0 0 1 85.333333 512C85.333333 276.352 276.352 85.333333 512 85.333333s426.666667 191.018667 426.666667 426.666667-191.018667 426.666667-426.666667 426.666667a424.874667 424.874667 0 0 1-234.666667-70.314667 42.666667 42.666667 0 1 1 46.933334-71.210667A341.333333 341.333333 0 1 0 512 170.666667z m222.165333 264.832a42.666667 42.666667 0 0 0-60.330666-60.330667L469.333333 579.669333l-119.168-119.168a42.666667 42.666667 0 0 0-60.330666 60.330667l149.333333 149.333333a42.666667 42.666667 0 0 0 60.330667 0l234.666666-234.666666z" p-id="2032" :fill="k.usage_calendar == 1 ? '#7885d1' : '#aaaaaa'"></path></svg>
                        <p>{{k.day}}</p>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="award">
            <h3>签到奖励</h3>
            <div class="award-list" v-for="item in giftList" :key="item.id">
                <img :src="item.icon" alt="">
                <div class="gift">
                    <p>{{item.name}}</p>
                    <p style="color:#999;">{{item.desc}}</p>
                </div>
                <template v-if="item.is_draw">
                    <button class="btn ishave">已领取</button>
                </template>
                <template v-else>
                    <button :class="[ item.available ? 'iscan water-ripple-btn' : '']" class="btn" @click="receive(item)">领取</button>
                </template>
            </div>
        </div>
    </div>

    <!-- 扫码加微信 -->
    <el-dialog
            v-model="showLink"
            center
            width="300px"
    >
        <template #title>
            <p style="padding: 14px; font-weight:700;font-size: 18px">{{linkTitle}}</p>
        </template>
        <div class="link-content">
            <img class="margin-center" style="width: 100%;" :src="giftLink" alt="">
        </div>
        <template #footer>
        </template>
    </el-dialog>

    <!-- 绑定微信后领取 -->
    <el-dialog
            v-model="needWx.show"
            center
            width="300px"
    >
        <template #title>
            <p style="padding: 14px; font-weight:700;font-size: 18px">绑定微信后领取</p>
        </template>
        <div class="link-content">
            <img class="margin-center" style="width: 100%;" :src="needWx.url" alt="">
        </div>
        <template #footer>
        </template>
    </el-dialog>
</template>
<script setup>
    import {ref, onMounted, reactive} from "vue"
    import { getCalendarApi, getGiftsApi, marketingDrawApi } from "@/api/user"
    import { ElMessage, ElMessageBox } from "element-plus"

    import icon7 from "@/assets/icon/daka/7.png"
    import icon14 from "@/assets/icon/daka/14.png"
    import icon30 from "@/assets/icon/daka/30.png"
    import iconpro from "@/assets/icon/daka/pro.png"
    import iconbig from "@/assets/icon/daka/big.png"

    const nowMonth = new Date().getMonth() + 1
    let weekList = [
        { label: "周日" },
        { label: "周一" },
        { label: "周二" },
        { label: "周三" },
        { label: "周四" },
        { label: "周五" },
        { label: "周六" }
    ]
    let timeRange = ref()
    let giftList = ref([])
    let dateList = ref([])
    let count = ref(0)
    let showLink = ref(false)
    let giftLink = ref("")
    let linkTitle = ref("")
    let needWx = reactive({
        show: false,
        url: ""
    })



    onMounted(() => {
        getCalendar()
        getGifts()
    })

    // 获取日历
    function getCalendar(){
        getCalendarApi().then((res) => {
            if(res.code == 200){
                res.data.list = supplementMonth(res.data.list)
                res.data.list = res.data.list.map((item,index) => {
                    item.day = item.date ? item.date.split("-")[2] : ""
                    if(item.usage_calendar){
                        count.value ++
                    }
                    return item
                })
                dateList.value = one2two(res.data.list, 7)
            }
        })
    }
    // 将数组转化为二维数组
    function one2two(list, number){
        // 向下取整看看有多少个
        let num = Math.ceil(list.length / number)
        let newList = []
        for(let i = 0; i < num; i++){
            newList.push(list.splice(0, number))
        }
        return newList
    }

    // 获取奖池
    function getGifts(){
        getGiftsApi().then(res => {
            if(res.code == 200){
                res.data = res.data.map((item,index) => {
                    if(index === 0){
                        item.icon = icon7
                        item.desc = "参与打卡3天"
                    }else if(index === 1){
                        item.icon = icon14
                        item.desc = "参与打卡7天"
                    }else if(index === 2){
                        item.icon = icon30
                        item.desc = "参与打卡14天"
                    }else if(index === 3){
                        item.icon = iconpro
                        item.desc = "参与打卡21天"
                    }else if(index === 4){
                        item.icon = iconbig
                        item.desc = "参与打卡24天"
                    }
                    return item
                })
                giftList.value = res.data
            }
        })
    }

    // 领取奖品
    let giftParams1 = ""
    let giftParams2 = ""
    function receive(item){
        if(!item.available){
            ElMessage({
                type: "warning",
                message: "抱歉, 您还没达标哦~ 继续加油"
            })
            return
        }
        marketingDrawApi({
            gift: item.goods_no
        }).then(res => {
            if(res.code === 200){
                if(res.message.need_wx === 1){
                    needWx.show = true
                    needWx.url = res.message.link
                    return false
                }
                if(item.goods_no === giftParams1){
                    showLink.value = true
                    linkTitle.value = "扫码领取优惠券"
                    giftLink.value = res.message.link
                    return
                }
                if(item.goods_no === giftParams2){
                    showLink.value = true
                    linkTitle.value = "加客服微信领取奖品"
                    giftLink.value = res.message.link
                    return
                }
                ElMessage({
                    type: "success",
                    message: "领取成功, 将在2小时内发放, 请及时查收"
                })
                item.is_draw = 1
            }
        })
    }

    // 补充月份时间
    function supplementMonth(list){
        if(nowMonth === 4){
            timeRange.value = "2022-04-01 ~ 2022-04-30"
            giftParams1 = "20220401004"
            giftParams2 = "20220401005"
            for(let i = 0; i < 5; i++){
                let nullObj = { date: "", usage_calendar: 0 }
                // list.push(nullObj)
                if(i < 5){
                    list.unshift(nullObj)
                }
            }
        }
        if(nowMonth === 5){
            timeRange.value = "2022-05-01 ~ 2022-05-31"
            giftParams1 = "20220501004"
            giftParams2 = "20220501005"
            for(let i = 0; i < 4; i++){
                let nullObj = { date: "", usage_calendar: 0 }
                list.push(nullObj)
                // if(i < 5){
                //     list.unshift(nullObj)
                // }
            }
        }
        return list
    }

</script>
<style lang="scss">
    .el-popper{
        .instruction{
            text-align: left;
            .tiaojian{
                font-size: 14px;
                color: #333;
            }
            .xuzhi{
                margin-bottom: 10px;
                span{
                    color: #666;
                    font-size: 14px;
                    font-weight: 700;
                }
                p{
                    color: #999;
                    font-size: 12px;
                    margin-bottom: 4px;
                }
            }
        }
    }
</style>
<style lang="scss" scoped>
    .calendar-com{
        padding: 20px;
    }
    .calendar{
        h3{
            text-align: center;
            color: $purple2;
            margin: 0;
        }
        .disc{
            text-align: right;
            color: #999;
            font-size: 12px;
            margin-bottom: 10px;
            cursor: pointer;
            &:hover{
                color: $purple;
            }
        }
        table{
            width: 100%;
            td, th {
                text-align: center;
                height: 40px;
            }
            td{
                background: rgba($color: $purple, $alpha: 0.1);;
                cursor: pointer;
                border-radius: 4px;
                padding: 4px 0;
                svg{
                    display: block;
                    margin: 0 auto;
                }
                p{
                    color: #8a8a8a;
                }
                &:hover{
                    background: #eee;
                }
            }
            .usage_calendar{
                box-shadow: 0 0 2px 1px $purple inset;
                font-weight: 700;
                p{
                    color: $purple;
                }
            }
        }
    }
    .award{
        h3{
            text-align: center;
            color: $purple2;
        }
        .award-list{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: rgba($color: $purple, $alpha: 0.1);
            border-radius: 4px;
            margin-bottom: 10px;
            img{
                width: 50px;
                height: 50px;
                // border-radius: 50%;
            }
            .gift{
                width: 200px;
                p:first-child{
                    color: #333;
                    font-weight: 700;
                    font-size: 16px;
                }
                // p:last-child{
                //     color: #999;
                //     font-size: 14px;
                // }
            }
            .btn{
                background: #999;
                color: #fff;
                width: 80px;
                height: 30px;
                border-radius: 30px;
                border: 1px solid #999;
                cursor: pointer;
            }
            .ishave{
                background: #ccc;
                border: 1px solid #ccc;
            }
            .iscan{
                background: $purple;
                &:hover{
                    opacity: 0.8;
                }
                &:active{
                    opacity: 1.2;
                }
            }
        }
    }
</style>