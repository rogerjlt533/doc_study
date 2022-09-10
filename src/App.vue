<template>
    <el-config-provider :locale="locale">
        <router-view></router-view>
    </el-config-provider>
</template>

<script setup>
    import { ref } from 'vue'
    import { useStore } from "vuex"
    import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
    // import { getToken } from "@/utils/auth"
    // import { initConnect, closeConnect } from "@/backService/ws/sync"
    // import { ipcRenderer } from "electron"

    const store = useStore()

    const locale = ref(null)
    locale.value = zhCn

    // if(getToken()){
    //     initConnect('ws://81.70.219.124:4379', getToken())
    // }
    // ipcRenderer.on("willQuitProgram", (event, data) => {
    //     console.log("123123123123123123")
    //     closeConnect()
    // })

</script>

<style lang="scss" scoped>
    .version{
        .a{
            cursor: pointer;
            &:hover{
                color: $purple;
            }
        }
    }
</style>
<style lang="scss">
    @import "./assets/font/font.css";
    body{
        //background: #fafafc;
        font-family: NoteSans;
        margin: 0;
        padding: 0;
    }
    p{
        margin: 0;
    }
    svg{
        &:focus{
            outline: none !important;
        }
    }

    .el-form--label-top .el-form-item__label{
        padding: 0;
    }

    .el-divider__text{
        background: #ffffff !important;
    }

    .el-loading-spinner .path{
        stroke: $purple !important;
    }
</style>

