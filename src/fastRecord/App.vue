<template>
    <div class="fast-container">
        <img class="logo" src="../assets/image/fangcunLogo.png" alt="">
        <input
                ref="inputRef"
                class="input"
                type="text"
                v-model="content"
                placeholder="💡 写下来，你在想些什么，按Enter保存"
                @keyup.enter="onSubmit"
        >
        <button
                class="button"
                @click="onSubmit"
        >记录</button>
    </div>
</template>

<script setup>
    import { ref, nextTick, getCurrentInstance } from 'vue'
    import { useStore } from "vuex"
    import { ipcRenderer } from "electron"
    // import {initMigration} from "@/utils/initBackService";

    const store = useStore()

    let content = ref('')
    const inputRef = ref(null)

    function onSubmit(){
        if(!content.value) return false
        const contentJson = {
            content: [{
                type: "paragraph",
                content: [{
                    text: `${content.value}`,
                    type: 'text'
                }]
            }],
            type: "doc"
        }
        const contentHtml = `<p>${content.value}</p>`

        let params = {
            json: contentJson,
            html: contentHtml,
            annotation_id: '',
            note_type: 1
        }

        content.value = ''
        ipcRenderer.send('fastSaveNote', params)
    }

    nextTick(() => {
        inputRef.value.focus()
    })

    // ipcRenderer.on('startSync', async (event, params) => {
    //     await initMigration()
    //     // initSync()
    // })

</script>

<style lang="scss" scoped>
    .fast-container{
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        overflow: hidden;
        padding: 0 20px;
        background: #f5f5f5;
        -webkit-app-region: drag;
        .logo{
            width: 40px;
            height: 40px;
            box-shadow: 2px 2px 10px -4px rgba(0, 0, 0, .5);
        }
        .input{
            border: 0;
            width: 100%;
            height: 20px;
            margin: 0 10px;
            padding: 10px;
            outline: none;
            font-size: 14px;
            color: #393939;
            -webkit-app-region: no-drag;
        }
        .button{
            width: 80px;
            height: 40px;
            border: 0;
            background: #7885d1;
            color: #FFFFFF;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            -webkit-app-region: no-drag;
            &:hover{
                opacity: 0.9;
            }
        }
    }
</style>