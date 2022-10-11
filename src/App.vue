<template>
    <!--    <router-view v-slot="{ Component }" v-if="hasDatabase">-->
    <!--		<keep-alive>-->
    <!--			<component :is="Component" v-if="$route.meta.keepAlive"/>-->
    <!--		</keep-alive>-->
    <!--		<component :is="Component" v-if="!$route.meta.keepAlive"/>-->
    <!--	</router-view>-->
    <el-config-provider :locale="locale">
        <router-view></router-view>
    </el-config-provider>
</template>

<script setup>
    import { ref } from 'vue'
    import { checkVersionApi } from '@/apiDesktop/system'
    import { ElConfigProvider } from "element-plus"
    import zhCn from 'element-plus/es/locale/lang/zh-cn'

    const locale = ref(null)
    locale.value = zhCn

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
</style>

