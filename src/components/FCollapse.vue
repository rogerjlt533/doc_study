<template>
    <!-- 自定义的折叠面板-->
    <transition
            name="show"
            v-on="on"
    >
        <slot></slot>
    </transition>
</template>

<script setup>
    const on = {
        beforeEnter(el) {
            if (!el.dataset) el.dataset = {}
            el.dataset.oldPaddingTop = el.style.paddingTop
            el.dataset.oldPaddingBottom = el.style.paddingBottom
            el.style.maxHeight = 0
            el.style.paddingTop = 0
            el.style.paddingBottom = 0
        },
        enter(el) {
            el.dataset.oldOverflow = el.style.overflow
            if (el.scrollHeight !== 0) {
                el.style.maxHeight = `${el.scrollHeight}px`
                el.style.paddingTop = el.dataset.oldPaddingTop
                el.style.paddingBottom = el.dataset.oldPaddingBottom
            } else {
                el.style.maxHeight = 0
                el.style.paddingTop = el.dataset.oldPaddingTop
                el.style.paddingBottom = el.dataset.oldPaddingBottom
            }
            el.style.overflow = 'hidden'
        },
        afterEnter(el) {
            el.style.maxHeight = ''
            el.style.overflow = el.dataset.oldOverflow
        },
        beforeLeave(el) {
            if (!el.dataset) el.dataset = {}
            el.dataset.oldPaddingTop = el.style.paddingTop
            el.dataset.oldPaddingBottom = el.style.paddingBottom
            el.dataset.oldOverflow = el.style.overflow
            el.style.maxHeight = `${el.scrollHeight}px`
            el.style.overflow = 'hidden'
        },
        leave(el) {
            if (el.scrollHeight !== 0) {
                el.style.maxHeight = 0
                el.style.paddingTop = 0
                el.style.paddingBottom = 0
            }
        },
        afterLeave(el) {
            el.style.maxHeight = ''
            el.style.overflow = el.dataset.oldOverflow
            el.style.paddingTop = el.dataset.oldPaddingTop
            el.style.paddingBottom = el.dataset.oldPaddingBottom
        },
    }

</script>

<style lang="scss" scoped>
    .show-enter-active,.show-leave-active{
        opacity: 1;
        transition: all .3s ease;
    }
    .show-enter-from, .show-leave-to {
        opacity: 0;
    }
</style>