import { Node, nodeInputRule, Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
// 用于图片粘贴上传
import {ElLoading, ElMessage} from "element-plus";
import axios from "axios";
import { getToken } from "@/utils/auth";
import bus from '@/utils/bus'

const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;
export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))/

/**
 * 编辑器图片上传的方法
 */
const api = process.env.VUE_APP_URL
let targetName
// 用于获取上传时的编辑框的显示loading
export const handleTargetName = (dom) => {
    targetName = dom ? dom : ".container-editor"
}
async function uploadFn(file) {
    const loading = ElLoading.service({
        target: targetName,
        lock: true,
        text: '上传中...',
        background: 'rgba(0, 0, 0, 0.5)',
    });
    let formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(api + '/api/user/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            hk: getToken()
        }
    })
    loading.close();
    if(response.data.code === 200){
        return response.data.data.file;
    }else{
        ElMessage.error("图片上传失败!")
    }
}

export function createImageExtension () {
    return Node.create({
        name: 'image',
        group: 'block',
        draggable: true,
        addAttributes: () => ({
            src: {},
            alt: { default: null },
            title: { default: null },
        }),
        parseHTML: () => [{
            tag: 'img[src]',
            getAttrs: (dom) => {
                if (typeof dom === 'string') return {};

                const element = dom
                const src = element.getAttribute('src')

                if(src.indexOf("api.fang-cun.net") === -1 && src.indexOf("stor.fang-cun.net") === -1) return false

                return {
                    src: element.getAttribute('src'),
                    title: element.getAttribute('title'),
                    alt: element.getAttribute('alt'),
                };
            },
        }],
        renderHTML: ({ HTMLAttributes }) => {
            return ['img', HTMLAttributes]
        } ,

        // @ts-ignore
        addCommands() {
            return (attrs) => (state, dispatch) => {
                const { selection } = state;
                const position = selection.$cursor
                    ? selection.$cursor.pos
                    : selection.$to.pos;
                const node = this.type.create(attrs);
                const transaction = state.tr.insert(position, node);
                dispatch(transaction);
            };
        },
        addInputRules() {
            return [
                nodeInputRule({
                    find: inputRegex,
                    type: this.type,
                    getAttributes: match => {
                        const [,, alt, src, title] = match

                        return { src, alt, title }
                    },
                }),
            ];
        },
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handlePaste(view, event, slice) {
                            const items = Array.from(event.clipboardData?.items || []);
                            const { schema } = view.state;

                            items.forEach((item) => {
                                const image = item.getAsFile();

                                if (item.type.indexOf('image') === 0) {
                                    event.preventDefault();

                                    if (uploadFn && image) {
                                        uploadFn(image).then((src) => {
                                            bus.emit('handlePasteImage', src)
                                            const node = schema.nodes.image.create({
                                                src: src
                                            });
                                            const transaction = view.state.tr.replaceSelectionWith(node);
                                            view.dispatch(transaction);
                                        });
                                    }
                                } else {
                                    const reader = new FileReader();
                                    reader.onload = (readerEvent) => {
                                        const node = schema.nodes.image.create({
                                            src: readerEvent.target?.result,
                                        });
                                        const transaction = view.state.tr.replaceSelectionWith(node);
                                        view.dispatch(transaction);
                                    };
                                    if (!image) return;
                                    reader.readAsDataURL(image);
                                }
                            });

                            return false;
                        },
                        handleDOMEvents: {
                            drop: (view, event) => {
                                const hasFiles =
                                    event.dataTransfer &&
                                    event.dataTransfer.files &&
                                    event.dataTransfer.files.length;

                                if (!hasFiles) {
                                    return false;
                                }

                                const images = Array.from(
                                    event.dataTransfer?.files ?? []
                                ).filter((file) => /image/i.test(file.type));

                                if (images.length === 0) {
                                    return false;
                                }

                                event.preventDefault();

                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({
                                    left: event.clientX,
                                    top: event.clientY,
                                });
                                if (!coordinates) return false;

                                images.forEach(async (image) => {
                                    const reader = new FileReader();

                                    if (uploadFn) {
                                        const node = schema.nodes.image.create({
                                            src: await uploadFn(image),
                                        });
                                        const transaction = view.state.tr.insert(coordinates.pos, node);
                                        view.dispatch(transaction);
                                    } else {
                                        reader.onload = (readerEvent) => {
                                            const node = schema.nodes.image.create({
                                                src: readerEvent.target?.result,
                                            });
                                            const transaction = view.state.tr.insert(coordinates.pos, node);
                                            view.dispatch(transaction);
                                        };
                                        reader.readAsDataURL(image);
                                    }
                                });

                                return true;
                            },
                        },
                    },
                })
            ];
        },
    });
};