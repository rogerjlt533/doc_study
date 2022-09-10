<template>
    <div class="note-set">
        <ul>
            <li>
                <span class="name">是否默认折叠笔记</span>
                <div>
                    <el-radio v-model="setting.fold_note" :label="1" @change="setUserMessage">是</el-radio>
                    <el-radio v-model="setting.fold_note" :label="0" @change="setUserMessage">否</el-radio>
                </div>
            </li>
            <li>
                <span class="name">默认笔记存放</span>
                <div>
                    <el-select v-model="setting.default" filterable placeholder="默认目标" size="small">
                        <template v-if="hasTeam">
                            <el-option-group
                                v-for="group in projectList"
                                :key="group.label"
                                :label="group.label"
                            >
                                <el-option
                                    v-for="item in group.list"
                                    :key="item.id"
                                    :label="item.collection"
                                    :value="item.id"
                                >
                                </el-option>
                            </el-option-group>
                        </template>
                        <template v-else>
                            <el-option
                                v-for="item in projectList"
                                :key="item.id"
                                :label="item.collection"
                                :value="item.id">
                            </el-option>
                        </template>
                    </el-select>
                    <el-button class="color-white" size="small" type="primary" color="#7885d1" :loading="isLoading" @click="sureDefaultProject">确定</el-button>
                </div>
            </li>
            <li>
                <span class="name">个性文本替换</span>
                <div>
                    <el-button class="color-white" size="small" type="primary" color="#7885d1" @click="showPersonalText = true">去设置</el-button>
                </div>
            </li>
            <p class="tips" style="padding: 0">* 设置一个关键词来替换为某些符号，减少了查找的时间，详细请移步至 <a class="atag" target="_blank" href="https://help.fangcun.in/help/change.html">帮助中心</a>。</p>
        </ul>


        <!-- 个性文本替换 -->
        <el-dialog title="个性文本替换" center width="350px"
                   v-model="showPersonalText"
                   :close-on-click-modal="false"
        >
            <el-dialog
                v-model="isPersonalAdd"
                width="300px"
                title="新增"
                append-to-body
            >
                <div class="personal-text personal-text-add">
                    <el-input v-model="normalText" placeholder="文本" size="small" style="width: 110px" />
                    <svg t="1641869493222" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1846" width="20" height="20"><path d="M418.24 448h-55.296l-39.488-105.984h-161.28L124.992 448h-55.296L217.216 60.736h53.504L418.24 448zM307.968 298.24l-58.496-160.96a180.352 180.352 0 0 1-6.016-27.008h-1.28c-1.792 11.648-3.84 20.608-6.208 27.008L177.984 298.24h129.984zM668.288 960V568.512h136c40.64 0 73.152 8.192 97.344 24.64 24.32 16.448 36.48 38.272 36.48 65.344 0 21.568-7.232 40.576-21.696 57.152-14.464 16.512-34.304 28.16-59.648 35.136v1.024c31.488 3.008 56.64 13.056 75.52 30.208 18.816 17.152 28.16 38.784 28.16 65.088 0 33.728-14.272 60.992-42.88 81.792-28.416 20.736-65.088 31.104-109.696 31.104h-139.584z m59.84-347.264v122.56h54.4c28.864 0 51.584-5.952 67.968-17.792a57.6 57.6 0 0 0 24.704-49.408c0-36.864-29.056-55.296-87.232-55.296h-59.84z m0 166.592v136.448h71.68c31.232 0 55.424-6.08 72.512-18.304a59.072 59.072 0 0 0 25.472-50.944c0-44.8-35.968-67.2-107.904-67.2h-61.76zM448 858.24l6.4-37.76A349.632 349.632 0 0 1 192 512h64a288.64 288.64 0 0 0 209.92 245.76l9.6-53.76 119.68 101.12-147.2 53.12z" p-id="1847" fill="#999999"></path></svg>
                    <el-input v-model="replaceText" placeholder="替换文本" size="small" style="width: 110px" />
                </div>
                <template #footer>
                    <div class="f-flex">
                        <el-button type="primary" size="small" @click="setUserQuick">确认</el-button>
                    </div>
                </template>
            </el-dialog>
            <el-scrollbar max-height="380px" :always="true">
                <template v-if="personalTextList.length > 0">
                    <div class="personal-text" v-for="(item,index) in personalTextList" :key="index" @click="activedIndex = index">
                        <el-input v-if="isPersonalEdit" v-model="item.phrase" placeholder="文本" size="small" style="width: 110px" />
                        <p v-else class="text line-1">{{item.phrase}}</p>
                        <svg t="1641869493222" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1846" width="20" height="20"><path d="M418.24 448h-55.296l-39.488-105.984h-161.28L124.992 448h-55.296L217.216 60.736h53.504L418.24 448zM307.968 298.24l-58.496-160.96a180.352 180.352 0 0 1-6.016-27.008h-1.28c-1.792 11.648-3.84 20.608-6.208 27.008L177.984 298.24h129.984zM668.288 960V568.512h136c40.64 0 73.152 8.192 97.344 24.64 24.32 16.448 36.48 38.272 36.48 65.344 0 21.568-7.232 40.576-21.696 57.152-14.464 16.512-34.304 28.16-59.648 35.136v1.024c31.488 3.008 56.64 13.056 75.52 30.208 18.816 17.152 28.16 38.784 28.16 65.088 0 33.728-14.272 60.992-42.88 81.792-28.416 20.736-65.088 31.104-109.696 31.104h-139.584z m59.84-347.264v122.56h54.4c28.864 0 51.584-5.952 67.968-17.792a57.6 57.6 0 0 0 24.704-49.408c0-36.864-29.056-55.296-87.232-55.296h-59.84z m0 166.592v136.448h71.68c31.232 0 55.424-6.08 72.512-18.304a59.072 59.072 0 0 0 25.472-50.944c0-44.8-35.968-67.2-107.904-67.2h-61.76zM448 858.24l6.4-37.76A349.632 349.632 0 0 1 192 512h64a288.64 288.64 0 0 0 209.92 245.76l9.6-53.76 119.68 101.12-147.2 53.12z" p-id="1847" fill="#999999"></path></svg>
                        <el-input v-if="isPersonalEdit" v-model="item.word" placeholder="替换文本" size="small" style="width: 110px" />
                        <p v-else class="text line-1">{{item.word}}</p>
                        <template v-if="isPersonalEdit">
                            <font-awesome-icon icon="times-circle" class="close" color="#F56C6C" @click="deteleUserQuick(index, item)" />
                            <font-awesome-icon v-show="activedIndex === index" icon="check-circle" class="close" color="#67C23A" @click="updateUserQuick(index, item)" />
                        </template>
                    </div>
                </template>
                <p class="personal-text-none" v-else>赶快添加属于自己的个性文本吧!</p>
            </el-scrollbar>
            <template #footer>
                <div class="personal-btn">
                    <el-button type="primary" size="small" @click="isPersonalAdd = true" v-show="!isPersonalEdit">新增</el-button>
                    <el-button type="warning" size="small"
                               @click="isPersonalEdit = !isPersonalEdit;activedIndex=null"
                    >{{isPersonalEdit ? '取消' : '编辑'}}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { ref, defineProps, toRefs, computed } from "vue"
    import { setGoalApi, setUserQuickApi, deteleUserQuickApi, updateUserQuickApi } from "@/api/user"
    import { useStore } from "vuex"
    import { ElMessage, ElMessageBox, ElNotification } from "element-plus";

    const store = useStore()

    const props = defineProps({
        setting: {
            type: Object,
            default: {}
        }
    })
    const { setting } = toRefs(props)

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

    // 默认笔记设置部分
    let hasTeam = !!(store.state.collection.projectListSelf.length && store.state.collection.projectListTeam.length)
    let projectList = []
    if(hasTeam){
        projectList = [
            {
                label: "个人笔记本",
                list: store.state.collection.projectListSelf
            },{
                label: "团队笔记本",
                list: store.state.collection.projectListTeam
            }
        ]
    }else{
        projectList = [ ...store.state.collection.projectListSelf, ...store.state.collection.projectListTeam]
    }

    let isLoading = ref(false)
    function sureDefaultProject(){
        isLoading.value = true
        setGoalApi({
            collection_id: setting.value.default
        }).then((res) => {
            isLoading.value = false
            if(res.code == 200){
                ElNotification.success("设置成功")
            }
        })
    }

    // 个性文本替换
    let showPersonalText = ref(false)
    let normalText = ref("")
    let replaceText = ref("")
    let personalTextList = computed(() => {
        return store.state.user.userQuickList
    })
    let isPersonalEdit = ref(false)
    let isPersonalAdd = ref(false)
    let activedIndex = ref("")

    function setUserQuick(){
        if(!normalText.value || !replaceText.value){
            ElMessage.error({
                message: '内容不能为空'
            });
            return
        }
        let data = {
            phrase: normalText.value,
            word: replaceText.value
        }
        setUserQuickApi(data).then((res) => {
            if(res.code == 200){
                isPersonalAdd.value = false
                normalText.value = ""
                replaceText.value = ""
                store.dispatch("user/getUserQuickList")
                ElMessage.success({
                    message: '添加成功',
                    duration: 800
                });
            }
        })
    }
    function deteleUserQuick(index, item){
        let data = {
            phrase_id: item.id
        }
        ElMessageBox({
            title: '提示',
            message: "确认删除?",
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        }).then(() => {
            deteleUserQuickApi(data).then((res) => {
                if(res.code == 200){
                    personalTextList.value.splice(index, 1)
                    store.dispatch("user/getUserQuickList")
                    ElMessage.success({
                        message: '删除成功',
                        duration: 800
                    });
                }
            })
        }).catch(()=>{})
    }
    function updateUserQuick(index, item){
        if(!item.phrase || !item.word){
            ElMessage.error({
                message: '内容不能为空'
            });
            return
        }
        let data = {
            phrase_id: item.id,
            phrase: item.phrase,
            word: item.word
        }
        updateUserQuickApi(data).then((res) => {
            if(res.code == 200){
                activedIndex.value = null
                store.dispatch("user/getUserQuickList")
                ElMessage.success({
                    message: '修改成功',
                    duration: 800
                })
            }
        })
    }
</script>

<style lang="scss" scoped>

</style>