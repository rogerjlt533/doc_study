<template>
    <div class="note-set">
        <ul>
            <li>
                <span class="name">导出笔记为markdown格式</span>
                <div>
                    <el-button size="small" type="primary" class="color-white" color="#7885d1" :loading="isloading" @click="exportMd">导出</el-button>
                </div>
            </li>
        </ul>
        <p class="tips">* 提供笔记全量导出功能，目前仅支持markdown格式，详细请移步至 <a class="atag" target="_blank" href="https://help.fangcun.in/help/export.html">帮助中心</a>。</p>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { exportNoteToMarkdownApi } from "@/api/user"

    let isloading = ref(false)
    function exportMd(){
        isloading.value = true
        exportNoteToMarkdownApi().then((res) => {
            if(res.code == 200){
                isloading.value = false
                window.open(res.data.download_url)
            }
        })
    }
</script>

<style lang="scss" scoped>
    .note-set{
        .name{
            width: 180px;
        }
    }
    .tips{
        color: #999999;
        font-size: 14px;
        padding-left: 40px;
    }
</style>