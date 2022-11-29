import { Plugin } from 'prosemirror-state'
import Image from '@tiptap/extension-image'
import ImageView from '../components/imagePluginComponents.vue'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import {ElLoading, ElMessage} from "element-plus"
import axios from "axios"
import { getToken } from "@/utils/auth"

export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))/

const api = process.env.VUE_APP_URL
let targetName
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

export const imagePluginFun = (func) => {
    return Image.extend({
        addAttributes() {
            return {
                src: {
                    default: null
                },
                alt: {
                    default: null
                },
                width: {
                    default: ''
                },
                height: {
                    default: ''
                },
                display: {
                    default: 'block',
                    renderHTML: ({ display }) => {
                        if (!display) {
                            return {};
                        }

                        const options = {
                            inline: 'display: inline',
                            block: 'display: block',
                            left: 'float: left',
                            right: 'float: right'
                        };

                        return {
                            style: options[display]
                        };
                    },
                    parseHTML: element => {
                        const display = element.style.float
                            ? element.style.float.replace(/['"]+/g, '')
                            : element.style.display.replace(/['"]+/g, '');
                        return {
                            display
                        };
                    }
                }
            };
        },
        addNodeView() {
            return VueNodeViewRenderer(ImageView);
        },
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handlePaste(view, event, slice) {
                            const items = Array.from(event.clipboardData?.items || []);
                            const { schema } = view.state;

                            console.log('event.clipboardData', event.clipboardData)

                            items.forEach((item) => {
                                const image = item.getAsFile();


                                if (item.type.indexOf('image') === 0) {
                                    event.preventDefault();
                                    if(image){
                                        uploadFn && uploadFn(image).then((src) => {
                                            func(src)
                                        });
                                    }else{
                                        item.getAsString((e) => {
                                            handleNoteImg(e)
                                        })
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
                                        uploadFn(image).then((src) => {
                                            func(src)
                                        })
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
        }
    })
}

// 提取src
function handleNoteImg(content){
    content.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/gi, function (match, capture) {
        console.log(capture);
    });
}

function imgUrlToFile(img, callback) {
    let fileName = img.split('/').pop()
    let type = fileName.split('.').pop()
    dataURLtoBlob(img, function(blobData) {
        let file = new File([blobData], fileName, {type: 'image/' + type})
        callback(file);
    });
}
// 图片url格式转为blob格式
function dataURLtoBlob(dataUrl, callback) {
    let xhr = new XMLHttpRequest()
    xhr.open("get", dataUrl, true)
    xhr.responseType = "blob"
    xhr.onload = function (res) {
        if (this.status === 200) {
            var blob = this.response
            callback(blob);
        }
    }
    xhr.send()
}
