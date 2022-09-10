<template>
    <div class="share-set">
        <ul>
            <li v-if="false">
                <span class="name">笔记默认公开分享</span>
                <div>
                    <el-radio v-model="setting.note_public" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.note_public" :label="0" @change="setUserMessage">否</el-radio>
                </div>
            </li>
            <li v-if="false">
                <span class="name">是否默认折叠笔记</span>
                <div>
                    <el-radio v-model="setting.fold_note" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.fold_note" :label="0" @change="setUserMessage">否</el-radio>
                </div>
            </li>
            <li>
                <span class="name">是否接收周报邮件</span>
                <div>
                    <el-radio v-model="setting.statistic_email_notify" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.statistic_email_notify" :label="0" @change="setUserMessage">否</el-radio>
                </div>
            </li>
            <li>
                <span class="name">是否接收微信通知</span>
                <div>
                    <el-radio v-model="setting.statistic_wx_notify" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.statistic_wx_notify" :label="0" @change="setUserMessage">否</el-radio>
                </div>
            </li>
            <li>
                <span class="name">是否接收统计通知</span>
                <div>
                    <el-radio v-model="setting.statistic_notify" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.statistic_notify" :label="0" @change="setUserMessage">否</el-radio>

                    <span style="font-size:12px;color:#999;">(关闭该项, 微信跟邮件都取消通知)</span>
                </div>
            </li>
            <li v-if="false">
                <span class="name">设置个性域名</span>
                <div>
                    <template v-if="userInfo.domain_is_set == 1">
                        <p class="domain">{{userInfo.domain}}</p>
                    </template>
                    <template v-else>
                        <el-input size="small" v-model="shareUrl" placeholder="http://xxx.com/[input]"></el-input>
                        <el-button size="small" type="primary" class="sure-btn" :disabled="!shareUrl" @click="sureShareUrl">确定</el-button>
                    </template>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
import {defineProps, ref, toRefs} from "vue"
    import { useStore } from "vuex"
import {ElMessage, ElMessageBox} from "element-plus";

    const store = useStore()

    const props = defineProps({
        setting: {
            type: Object,
            default: {}
        },
        userInfo: {
            type: Object,
            default: {}
        }
    })
    const { setting, userInfo } = toRefs(props)

    // 设置用户信息
    function setUserMessage(key,value){
        let obj = {
            fold_note: setting.value.fold_note,
            note_public: setting.value.note_public,
            statistic_email_notify: setting.value.statistic_email_notify,
            statistic_wx_notify: setting.value.statistic_wx_notify,
            statistic_notify: setting.value.statistic_notify
        }
        store.dispatch("user/setUser",obj);
    }

    // 设置个性域名
    let shareUrl = ref("");
    shareUrl.value = userInfo.value.domain;
    function sureShareUrl(){
        ElMessageBox({
            title: '提示',
            message: "个性域名只能设置一次, 确认保存?",
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        }).then(() => {
            domainApi({
                domain: shareUrl.value
            }).then((res) => {
                if(res.code == 200){
                    ElMessage.success({
                        message: '设置成功！'
                    });
                }
            })
        }).catch(()=>{})
    }
</script>

<style lang="scss" scoped>

</style>