import { createStore, createLogger } from "vuex"
import createPersistedState from './plugins/vuex-storage'

import notes from "./modules/notes.js"
import user from "./modules/user.js"
import collection from "./modules/collection.js"


// 判断当前环境
const debug = process.env.NODE_ENV !== 'production'

export default createStore({
	state: {
		showTagsGroup: false,
		editorHeight: 0
	},
	mutations: {
		SET_TAGS_GROUP(state){
			state.showTagsGroup = !state.showTagsGroup
		},
		SET_EDITORHEIGHT(state, data){
			state.editorHeight = data;
			// console.log(state, data);
		},
		CLEAR_VUEX(state) {
			state.user = {
				isShowNotice: false,
				token: "",
				userInfo: {},
				userSetting: {},
				userBase: {},
				noticeList: [],
				userRight: null,
				userQuickList: []
			};
			state.notes = {
				cachedNote: "",
				notesListHeight: "calc(100vh - 196px)",
				classifyObj: {
					title: '我的笔记',
					actived: 0,
					collectionActived: null,
					collectionType: null,
					activedTag: null
				},
				notes:{
					tag_id: undefined,
					group_id: undefined,
					collection_id: undefined,
					trash: undefined,
					today: undefined,
					note_type: 1,
					sort: "desc"
				},
				writeNoteActive:{
					active: 0
				},
				editorCollection:{
					checked_collection: "",
					collection_id: "",
				},
				tagToCollectionId: "",
				writeNote: [],
				noteslist: [],
				tagsGroupList: [],
				tagsAllList: [],
				tagsTopList: [],
				tagsList: [],
				isFinish: true
			};
			state.collection = {
				projectListSelf: [],
				projectListTeam: []
			};
		},
	},
	actions: {

	},
	modules: {
		notes,
		user,
		collection,
	},
	plugins: [
		createPersistedState()
	],
})
