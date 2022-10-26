<template>
    <div class="body-center">
        <div class="header">
            <el-row align="middle">
                <el-col :span="4">
                    <div class="avatar">
                        <img :src="userInfo?.avatar" alt="">
                    </div>
                </el-col>
                <el-col :span="16">
                    <div class="userinfo">
                        <p>{{userInfo?.name}}</p>
                        <proIcon :isPro="userRight?.is_pro" :isEdu="userRight?.is_edu" />
                    </div>
                </el-col>
                <el-col :span="4">
                    <a href="https://fangcun.in/home">
                        <el-button type="primary" size="small" color="#7885d1">我的方寸笔迹</el-button>
                    </a>
                </el-col>
            </el-row>
        </div>
        <div class="content">
            <div class="content-html" v-html="noteDetails?.note"></div>
        </div>
        <h4>历史笔记</h4>
        <div class="history" v-if="historyDetails?.list.length > 0">
            <el-timeline>
                <template v-for="history in historyDetails?.list" :key="history.id">
                    <el-timeline-item :timestamp="history.edit_time" placement="top">
                        <el-card shadow="hover">
                            <div class="content-html" v-html="history?.former_note"></div>
                        </el-card>
                    </el-timeline-item>
                </template>
            </el-timeline>
        </div>
        <div class="history" v-else>
            <el-empty description="没有相关历史笔记哦~~"></el-empty>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, computed } from "vue"
    import { noteInfoApi } from "@/api/notes"
    import { useStore } from "vuex"
    import { useRoute } from "vue-router";
    import proIcon from "@/components/element/proIcon.vue"

    const route = useRoute()
    const store = useStore()

    let note_id = ""
    if(route.query.id){
        note_id = route.query.id
    }
    // store.dispatch("user/getUserInfo")
    store.dispatch("user/getUserRight")

    const userInfo = computed(() => store.state.user.userInfo )
    const userRight = computed(() => store.state.user.userRight )
    let noteDetails = ref()
    let historyDetails = ref()
    const getNoteInfo = () => {
        const data = {
            note_id: note_id,
            use_history: 1
        }
        noteInfoApi(data).then((res) => {
            console.log(res)
            if(res.code == 200){
                noteDetails.value = res.data.note
                historyDetails.value = res.data.history
            }
        })
    }

    onMounted(() => {
        getNoteInfo()
    })
</script>

<style lang="scss" scoped>
    .body-center{
        width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    .header{
        background: #ffffff;
        padding: 20px 0;
        .avatar{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            padding: 6px;
            margin: 0 auto;
            background: #f5f5f5;
            border-radius: 4px;
            img{
                width: 100%;
            }
        }
        .userinfo{
            p{
                font-size: 20px;
                color: #333333;
                font-weight: 700;
            }
        }
    }
    .content{
        margin-top: 20px;
        padding: 20px;
        background: #ffffff;
        .note{
            width: calc(100% - 40px);
            padding: 20px;
        }
    }
    h4{
        margin: 0;
        padding: 10px 20px;
        //border-top: 2px solid #f5f5f5;
    }
    .history{
        padding: 20px 20px 10px 10px;
        background: #ffffff;
    }
</style>