<template>
    <div class="fc-code">
        <el-button
            v-bind="$attrs"
            style="width: 100px;"
            @click="start"
            :type="btnType"
        >{{ btnText }}</el-button>
    </div>
</template>

<script setup>
    import { ref, defineEmits, defineProps, watch } from "vue"
    import { ElMessage } from "element-plus"
    const emits = defineEmits(['start', 'end'])
    const props = defineProps({
        value: String
    })

    const TIME = 60
    const WAIT = 1000
    const phoneRule = /^1(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])\d{8}$/
    let countdown = TIME
    let timer = null
    let btnText = ref("获取验证码")
    let btnType = ref('info')

    watch(() => props.value, (value) => {
        if(value){
            if(phoneRule.test(value)){
                btnType.value = "primary"
            }else{
                btnType.value = "info"
            }
        }else{
            btnType.value = "info"
        }
    })

    function start(){
        if(btnType.value === 'info') return false
        if(!props.value) {
            ElMessage.warning('请填写手机号')
            return false
        }

        emits("start")
        btnType.value = "info"
        btnText.value = `${countdown}秒`
        timer = setInterval(() => {
            countdown --
            btnText.value = `${countdown}秒`
            if(countdown === 0){
                clearInterval(timer)
                timer = null
                countdown = TIME
                btnType.value = "primary"
                btnText.value= "重新获取"
                // 倒计时结束时通知
                end()
            }
        }, WAIT)
    }

    function end(){
        emits("end")
    }
</script>

<style lang="scss">
    .fc-code{
        display: inline-block;
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