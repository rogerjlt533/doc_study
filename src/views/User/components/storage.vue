<template>
    <div class="storage" v-if="userRight">
        <div class="remaining">
            <font>{{userRight.percent}}%</font>
            <span>{{userRight.left}}{{userRight.unit}}/{{baseSpace}}{{userRight.unit}}</span>
        </div>
        <el-progress
            :text-inside="true"
            :stroke-width="18"
            :percentage="userRight.percent"
            :format="format"
            color="#7885d1"
        />
        <div class="info">
            <p v-if="userRight.is_pro">享受每月500M媒体资源以及图片文字识别。了解更多 <a target="_blank" href="https://help.fangcun.in/help/PRO.html">pro权益</a></p>
            <p v-if="userRight.is_edu">针对学生提供200M媒体资源流量以及图片文字识别功能。了解更多 <a target="_blank" href="https://help.fangcun.in/help/PRO.html">edu权益。</a></p>
            <p v-if="userRight.is_base">您正在享受基础版方寸笔迹服务，每月100M媒体资源流量。了解更多 <a target="_blank" href="https://help.fangcun.in/help/PRO.html">基础权益</a></p>
        </div>
    </div>
</template>

<script setup>
    import { defineProps, toRefs, computed} from "vue"
    import { exportNoteToMarkdownApi } from "@/api/user"
    const props = defineProps({
        userRight: {
            type: Object,
            default: {}
        }
    })
    const { userRight } = toRefs(props)

    // 设置资源剩余量的文案提示
    const format = (percentage) => percentage === 0 ? '无资源剩余' : `资源剩余${userRight.value.percent}%`
    // 储存空间基数
    const baseSpace = computed(() => {
        let number = 100;
        if(userRight.value.is_pro){
            number = 500
        }else if(!userRight.value.is_pro && userRight.value.is_edu){
            number = 200
        }
        return number
    })
</script>

<style lang="scss" scoped>
    .storage{
        width: 550px;
        margin-left: 40px;
        .remaining{
            font{
                font-weight: bold;
                color: $purple;
                font-size: 30px;
            }
            span{
                color: #999;
                font-size: 14px;
                margin-left: 10px;
            }
        }
        .info{
            font-size: 14px;
            color: #666;
            margin-top: 20px;
            a{
                text-decoration: none;
                color: $purple;
                cursor: pointer;
            }
        }
    }
</style>