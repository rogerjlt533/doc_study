<template>
    <div class="annotation-box" ref="annotationRef">
        <div class="note-cont" :class="[ isFlod && annotationHeight > 60 ? 'annotation-max-height' : '' ]">
            <span class="user-name" v-if="false">{{data.user_name}}: </span>
            <div class="content-html" style="color:#999" v-html="data.note"></div>
        </div>
        <div>
            <!--<div class="fold-text" v-if="edit" @click="closeQuote">-->
            <!--    <font-awesome-icon icon="times-circle" color="#9EA0AD" />-->
            <!--</div>-->
            <div class="fold-text" v-if="annotationHeight > 60" @click="isFlod = !isFlod;">
                <font-awesome-icon v-if="isFlod" icon="angle-down" color="#9EA0AD" class="margin-center"/>
                <font-awesome-icon v-else icon="angle-up" color="#9EA0AD" class="margin-center" />
            </div>
        </div>
    </div>
</template>
<script setup>
    import { ref, defineEmits, defineProps, onMounted } from "vue";
    import svgPath from "@/assets/svgPath/index.js"
    const props = defineProps({
        data: {
            type: Object,
            default: {}
        },
        edit: {
            type: Boolean,
            default: false
        }
    });
    const emits = defineEmits(['close'])

    function closeQuote(){
        emits("close")
    }

    let annotationRef = ref(null);
    let annotationHeight = ref(0);
    let isFlod = ref(true)
    onMounted(()=>{
        setTimeout(() => {
            if(annotationRef.value){
                annotationHeight.value = annotationRef.value.offsetHeight;
                if(annotationRef.value.offsetHeight > 60){
                    isFlod.value = true;
                }else{
                    isFlod.value = false;
                }
            }
        }, 200)
    })
</script>
<style lang="scss" scoped>
    .annotation-box{
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        border-left: 2px solid #ccc;
        margin-top: 10px;
        padding: 6px;
        background: #eeeeee;
        border-radius: 4px;
        .quote{
            color: $purple;
            font-size: 14px;
        }
        .note-cont{
            margin: 0 10px;
            .user-name{
                display: block;
                font-size: 14px;
                margin-bottom: 4px;
                color: #999;
            }
        }
        .fold-text{
            font-size: 14px;
            line-height: 16px;
            background: #eeeeee;
            padding: 2px 4px;
            cursor: pointer;
            margin-bottom: 2px;
        }
    }
    .annotation-max-height{
        max-height: 40px;
        overflow: hidden;
    }
</style>