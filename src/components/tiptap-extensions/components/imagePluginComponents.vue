<template>
    <node-view-wrapper as="div" :class="imageViewClass">
        <div
                draggable="true"
                data-drag-handle
                :class="{
                'image-view__body--focused': selected,
                'image-view__body--resizing': resizing,
             }"
                class="image-view__body"
        >
            <img
                    @load="onImageLoad"
                    @click="selectImage"
                    :src="src"
                    :alt="node.attrs.alt"
                    :width="width"
                    :height="height"
                    class="image-view__body__image"
            >
            <div class="image-word" v-show="selected || resizing" @click="pictureToWord">
                <span>图片转文字</span>
            </div>
            <div
                    v-show="selected || resizing"
                    class="image-resizer">
                <span
                        v-for="direction in resizeDirections"
                        :key="direction"
                        @mousedown="onMouseDown($event, direction)"
                        :class="`image-resizer__handler--${direction}`"
                        class="image-resizer__handler">
                </span>
            </div>
        </div>
    </node-view-wrapper>
</template>

<script>
    import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

    function clamp(val, min, max) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    }

    const ResizeDirection = {
        TOP_LEFT: 'tl',
        TOP_RIGHT: 'tr',
        BOTTOM_LEFT: 'bl',
        BOTTOM_RIGHT: 'br'
    };

    const MIN_SIZE = 20;
    const MAX_SIZE = 100000;

    export default {
        props: {
            ...nodeViewProps,
            selected: { type: Boolean, required: true }
        },
        data: vm => ({
            imgDisplay: 'right',
            maxSize: {
                width: MAX_SIZE,
                height: MAX_SIZE
            },
            originalSize: {
                width: 0,
                height: 0
            },
            resizeOb: new ResizeObserver(() => {
                vm.getMaxSize();
            }),
            resizeDirections: [
                ResizeDirection.TOP_LEFT,
                ResizeDirection.TOP_RIGHT,
                ResizeDirection.BOTTOM_LEFT,
                ResizeDirection.BOTTOM_RIGHT
            ],
            resizing: false,
            resizerState: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                dir: ''
            }
        }),
        computed: {
            src() {
                return this.node.attrs.src;
            },
            width() {
                return this.node.attrs.width;
            },
            height() {
                return this.node.attrs.height;
            },
            display() {
                return this.node.attrs.display;
            },
            imageViewClass() {
                return [
                    'image-view',
                    `image-view--${this.display}`
                ];
            }
        },
        methods: {
            onImageLoad(e) {
                this.originalSize = {
                    width: e.target.width,
                    height: e.target.height
                };
            },
            selectImage() {
                this.editor.commands.setNodeSelection(this.getPos());
            },

            getMaxSize() {
                const { width } = getComputedStyle(this.editor.view.dom);
                this.maxSize.width = parseInt(width, 10);
            },

            pictureToWord(){
                this.$parent.$emit('imageToWord', {
                    src: this.src
                })
            },

            onMouseDown(e, dir) {
                e.preventDefault();
                e.stopPropagation();

                this.resizerState.x = e.clientX;
                this.resizerState.y = e.clientY;

                const originalWidth = this.originalSize.width;
                const originalHeight = this.originalSize.height;
                const aspectRatio = originalWidth / originalHeight;

                let width = Number(this.node.attrs.width);
                let height = Number(this.node.attrs.height);
                const maxWidth = this.maxSize.width;

                if (width && !height) {
                    width = width > maxWidth ? maxWidth : width;
                    height = Math.round(width / aspectRatio);
                } else if (height && !width) {
                    width = Math.round(height * aspectRatio);
                    width = width > maxWidth ? maxWidth : width;
                } else if (!width && !height) {
                    width = originalWidth > maxWidth ? maxWidth : originalWidth;
                    height = Math.round(width / aspectRatio);
                } else {
                    width = width > maxWidth ? maxWidth : width;
                }

                this.resizerState.w = width;
                this.resizerState.h = height;
                this.resizerState.dir = dir;

                this.resizing = true;

                this.onEvents();
            },

            onMouseMove(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!this.resizing) return;

                const { x, y, w, h, dir } = this.resizerState;

                const dx = (e.clientX - x) * (/l/.test(dir) ? -1 : 1);
                const dy = (e.clientY - y) * (/t/.test(dir) ? -1 : 1);

                this.updateAttributes({
                    width: clamp(w + dx, MIN_SIZE, this.maxSize.width),
                    height: Math.max(h + dy, MIN_SIZE)
                });
            },

            onMouseUp(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!this.resizing) return;

                this.resizing = false;

                this.resizerState = {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    dir: ''
                };

                this.offEvents();
                this.selectImage();
            },

            onEvents() {
                document.addEventListener('mousemove', this.onMouseMove, true);
                document.addEventListener('mouseup', this.onMouseUp, true);
            },

            offEvents() {
                document.removeEventListener('mousemove', this.onMouseMove, true);
                document.removeEventListener('mouseup', this.onMouseUp, true);
            }
        },
        mounted() {
            this.resizeOb.observe(this.editor.view.dom);
        },

        beforeDestroy() {
            this.resizeOb.disconnect();
        },
        components: {
            NodeViewWrapper
        }
    };
</script>

<style lang="scss" scoped>
    .image-view {
        display: inline-block;
        max-width: 100%;
        margin: 4px;
        padding: 0 2px;

        &--inline {
            margin-right: 12px;
            margin-left: 12px;
        }

        &--block {
            display: flex;
        }

        &--left {
            margin-right: 12px;
            margin-left: 0;
            float: left;
        }

        &--right {
            margin-right: 0;
            margin-left: 12px;
            float: right;
        }

        &__body {
            display: flex;
            position: relative;
            max-width: 100%;
            clear: both;
            outline-color: transparent;
            outline-style: solid;
            outline-width: 2px;
            transition: all 0.2s ease-in;

            &:hover {
                outline-color: #eee;
            }

            &--focused:hover,&--resizing:hover {
                outline-color: transparent;
            }

            &__placeholder {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
            }

            &__image {
                position: relative;
                margin: 0;
                cursor: pointer;
                z-index: 10;
            }
        }
    }

    .image-dimensions {
        display: flex;
        position: absolute;
        width: 100%;
        height: 100%;
        justify-content: flex-end;
        align-items: flex-end;

        div {
            padding: 10px;
            background: #fff;
            opacity: 0.7;
        }
    }

    .image-word{
        position: absolute;
        bottom: 0;
        right: -4px;
        z-index: 20;
        background: rgba(0,0,0,.5);
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        transform: scale(0.8);
        &:hover{
            background: rgba(0,0,0,.8);
        }
        span{
            color: #fff;
            font-size: 12px;
        }
    }

    .image-resizer {
        position: absolute;
        top: -2px;
        left: -2px;
        width: 100%;
        height: 100%;
        border: 1px solid #cccccc;
        padding: 1px;
        z-index: 1;

        &__handler {
            display: block;
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: $purple;
            border: 1px solid #fff;
            border-radius: 4px;
            box-sizing: border-box;
            z-index: 2;

            &--tl {
                top: -4px;
                left: -4px;
                cursor: nwse-resize;
            }

            &--tr {
                top: -4px;
                right: -4px;
                cursor: nesw-resize;
            }

            &--bl {
                bottom: -4px;
                left: -4px;
                cursor: nesw-resize;
            }

            &--br {
                right: -4px;
                bottom: -4px;
                cursor: nwse-resize;
            }
        }
    }
</style>
