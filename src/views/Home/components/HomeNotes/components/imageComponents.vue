<template>
    <NodeViewWrapper
            data-type="draggable-item"
            data-drag-handle
            draggable="true"
            contenteditable="true"
            style="position: relative;"
    >
        <img
                class="image"
                :style="imgStyle"
                :src="imgProps.src"
                :alt="imgProps.alt"
                @click="handleClick"
        />
    </NodeViewWrapper>
</template>

<script>
    import { defineComponent } from "vue"
    import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
    export default defineComponent ({
        props: nodeViewProps,
        components: {
            NodeViewWrapper
        },
        data(){
            return {

            }
        },
        computed: {
            imgStyle(){
                const { width, ratio, align } = this.node.attrs
                return {
                    objectFit: "cover",
                    objectPosition: "50% 50%",
                    width: `${width}%`,
                    height: "auto",
                    aspectRatio: ratio,
                }
            },
            imgProps(){
                const { src, alt } = this.node.attrs
                return {
                    src, alt
                }
            }
        },
        mounted() {

        },
        methods: {
            handleClick(){

            }
        }
    })
</script>

<style lang="scss" scoped>
    .ProseMirror-hideselection{
        img{
            box-shadow: 0 0 0 4px rgb(108 86 246 / 30%);
        }
    }
    .image{
        margin: 4px;
    }
</style>