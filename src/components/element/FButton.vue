<template>
    <button class="fc-button">
        <el-icon>
            <component :is="props.icon"></component>
        </el-icon>
        <slot></slot>
    </button>
</template>

<script setup>
    import { computed } from "vue"

    const props = defineProps({
        icon: Object,
        color: String
    })

    const colorStyle = computed(() => {
        return {
            color: ''
        }
    })

</script>

<style lang="scss" scoped>
    .fc-button{

    }
</style>