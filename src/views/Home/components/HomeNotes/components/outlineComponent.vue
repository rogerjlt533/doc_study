<template>
    <div class="short-note-contains outline-contains">
        <p class="title">大纲</p>
        <ul class="outline-list">
            <li
                    :class="[anchorActive === item.id ? 'outlineActive' : '']"
                    :style="{paddingLeft: `${(item.level - 1) * 10}px` }"
                    v-for="item in outline" :key="item.id"
                    @click="scrollIntoView(item)"
            >
                {{ item.text }}
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref, defineProps } from "vue"

    const { outline } = defineProps({
        outline: {
            type: Array,
            default: []
        }
    })

    let anchorActive = ref('')
    function scrollIntoView(item){
        anchorActive.value = item.id
        const element = document.getElementById(item.id)
        element.scrollIntoView({behavior: "smooth", block: "start"})
    }
</script>

<style lang="scss" scoped>
    .short-note-contains{
        position: absolute;
        top: 100px;
        right: 0px;
        width: 280px;
        height: calc(100vh - 110px);
        background: #fafafc;
        z-index: 999;
        overflow: hidden;
        box-shadow: -4px 4px 10px 0px rgba(0, 0, 0, .1);
        .title{
            text-align: center;
            padding: 10px 0 0;
            font-size: 16px;
            color: #999999;
            font-weight: bold;
        }
    }
    .outline-contains{
        width: 200px;
        .outline-list{
            height: calc(100vh - 82px);
            margin: 0 0 10px 0;
            padding: 0 20px;
            list-style: none;
            overflow: scroll;
            scrollbar-color: transparent transparent;
            &::-webkit-scrollbar {
                display: none;
            }
            li{
                cursor: pointer;
                font-size: 12px;
                padding: 8px 0;
                color: #696969;
                &:hover{
                    color: $purple;
                    background: #f5f5f5;
                }
            }
            .outlineActive{
                color: $purple;
            }
        }
    }
</style>