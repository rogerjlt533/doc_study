import { computed } from 'vue'
import openUrlByBrowser from "@/assets/js/openUrlByBrowser";
import previewImg from "@/components/imagePreview";
import bus from '@/utils/bus'
import store from "@/store/index.js"

/**
 * 点击笔记中的元素时的操作
 * @param e
 * @param type
 * @returns {boolean}
 */
export function getNoteNodeClick(e, type){
    // 当点击到图片时
    if(!type && e.target.src){
        previewImg({
            url: e.target.src,
            show: true
        })
    }
    // 当点击的是tag时
    if(!type && e.target.className === "hashtag-suggestion"){
        let id = getClickTagId(e.target.dataset.id);
        filterTagsNotes(id, e.target.dataset.id);
    }
    // 当点击的是a标签时
    if(e.target.localName === 'a' && e.target.href){
        e.preventDefault()
        const url = e.target.href
        openUrlByBrowser(url)
        return false
    }
}
export const dblclickNote = (e) => {
    if(e.target.src){
        previewImg({
            url: e.target.src,
            show: true
        })
    }
}

function getClickTagId(name){
    let tagsList = store.state.notes.tagsAllList;
    for(let i = 0; i < tagsList.length; i++){
        if(tagsList[i].tag === name){
            return tagsList[i].id
        }
    }
}
function filterTagsNotes(id, tag){
    bus.emit("setTagToEditor", {
        tag: tag
    })
    store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
        tag_id: id
    })
    store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
        tagActive: id,
        tagTitle: `#${tag}`,
    })
    store.commit("user/SHOW_NOTICE",{data: false});
    bus.emit("clearSearchKeyword");
}

