import { Extension, textInputRule } from '@tiptap/core'
import store from "@/store/index.js"
import { computed } from "vue";

export default function smartRules (){
  let personalTextList = computed(() => { return store.state.user.userQuickList })
  if(!personalTextList.value) return false
  let list = personalTextList.value.map((item) => {
    let reg = RegExp(item.phrase + " $")
    return textInputRule({
      find: reg,
      replace: item.word
    })
  })
  return Extension.create({
    name: 'smartRules',
    addInputRules() {
      return list
    },
  })
}


