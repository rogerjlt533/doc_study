<template>
    <!-- 自定义的折叠面板-->
    <transition
            name="show"
            @enter="enterBox"
            @afterEnter="afterEnter"
            @leave="leaveBox"
    >
        <slot></slot>
    </transition>
</template>

<script setup>
    function enterBox(element){
        const width = getComputedStyle(element).width
        element.style.width = width
        element.style.position = 'absolute'
        element.style.visibility = 'hidden'
        element.style.height = 'auto'

        const height = getComputedStyle(element).height
        element.style.width = null
        element.style.position = null
        element.style.visibility = null
        element.style.height = 0

        getComputedStyle(element).height

        requestAnimationFrame(() => {
            element.style.height = height
        });
    }
    function afterEnter(element) {
        element.style.height = 'auto'
    }
    function leaveBox(element) {
        const height = getComputedStyle(element).height

        element.style.height = height

        getComputedStyle(element).height
        requestAnimationFrame(() => {
            element.style.height = 0
        })
    }
</script>

<style lang="scss" scoped>
    .show-enter-active,
    .show-leave-active {
        transition: height .5s ease-in-out;
        overflow: hidden;
    }
    .show-enter,
    .show-leave-to {
        height: 0;
    }
</style>