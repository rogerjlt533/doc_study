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
		editorHeight: 0,
		showDialog: false
	},
	mutations: {
		SET_TAGS_GROUP(state){
			state.showTagsGroup = !state.showTagsGroup
		},
		SET_EDITORHEIGHT(state, data){
			state.editorHeight = data;
			// console.log(state, data);
		},
		SET_NEXT_NOT_SHOW_DIALOG(state, data){
			state.showDialog = data
		},

		RESET_VUEX_STATE(state, data){
			state.user = data.user
			state.notes = data.notes
			state.collection = data.collection
		},
		RESET_BASE_DATA(state, data){
			state.user = data.user
			state.collection = data.collection
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
				notesListHeight: "calc(100vh - 208px)",
				catalogState: {
					showSelfCollection: false,
					showTeamCollection: false,
					showTags: false
				},
				catalogActiveState: {
					noteTypeActive: 1,
					collectionActive: '',
					tagActive: '',
					tagGroupActive: '',
					trashActive: false,
					collectionTitle: '',
					tagTitle: '',
					tagGroupTitle: '',
					short_note_count: 0,
					long_note_count: 0
				},
				notes: {
					tag_id: '',
					group_id: '',
					collection_id: '',
					trash: '',
					note_type: 1,
					orderby_create: 1,
					sort: "desc"
				},
				writeNoteState: {
					active: '',
					note: '',
					collection_id: ''
				},
				editNoteCount: 0,
				noteslist: [],
				notesCount: 0,
				writeNotesList: [],
				tagsGroupList: [],
				tagsAllList: [],
				tagsTopList: [],
				tagsList: [],
				tagInitialList: {
					pt: [],
					fz: []
				},
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
