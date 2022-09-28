<template>
    <!--    <router-view v-slot="{ Component }" v-if="hasDatabase">-->
    <!--		<keep-alive>-->
    <!--			<component :is="Component" v-if="$route.meta.keepAlive"/>-->
    <!--		</keep-alive>-->
    <!--		<component :is="Component" v-if="!$route.meta.keepAlive"/>-->
    <!--	</router-view>-->
    <router-view></router-view>
</template>

<script setup>
    import { computed, ref } from 'vue'
    import { useStore } from 'vuex'
    import { checkVersionApi } from '@/apiDesktop/system'
    import { getToken } from "@/utils/auth"
    import { ElDialog } from "element-plus"
    import { shell } from "electron";

    const store = useStore()

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

    .el-dialog__header{
        border-bottom: 1px solid #eee;
        margin-right: 0;
    }
    .el-dialog__footer{
        border-top: 1px solid #eee;
    }
    .el-form--label-top .el-form-item__label{
        padding: 0;
    }
</style>

