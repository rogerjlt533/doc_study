import { computed } from 'vue'
import openUrlByBrowser from "@/assets/js/openUrlByBrowser";
import previewImg from "@/lib/imagePreview";
import bus from '@/utils/bus'
import store from "@/store/index.js"

/**
 * 点击笔记中的元素时的操作
 * @param e
 * @returns {boolean}
 */
export function getNoteNodeClick(e){
    // 当点击到图片时
    if(e.target.src){
        previewImg({
            url: e.target.src,
            show: true
        })
    }
    // 当点击的是tag时
    if(e.target.className === "hashtag-suggestion"){
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
function getClickTagId(name){
    let tagsList = store.state.notes.tagsAllList;
    for(let i = 0; i < tagsList.length; i++){
        if(tagsList[i].tag === name){
            return tagsList[i].id
        }
    }
}
function filterTagsNotes(id, tag){
    bus.emit("SET_TEXT_EDITOR_TAG", {
        tag: tag
    })
    store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
        collectionTitle: store.state.notes.classifyObj.collectionTitle,
        tagTitle: `#${tag}`,
        tag_id: id,
        activedTag: id,
        collectionType: store.state.notes.classifyObj.collectionType,
        collectionActived: store.state.notes.classifyObj.collectionActived,
        collection_id: store.state.notes.tagToCollectionId
    })
    store.commit("user/SHOW_NOTICE",{data: false});
    bus.emit("CLEAR_KAYWORD");
}

