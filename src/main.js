import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {
    ElConfigProvider, ElButton, ElForm, ElFormItem, ElInput, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSelect, ElOption, ElIcon, ElDialog, ElMenu, ElMenuItem, ElCollapse, ElCollapseItem, ElCollapseTransition, ElPopover, ElRow, ElCol, ElTimeline, ElTimelineItem, ElCard, ElEmpty, ElDivider, ElInputNumber, ElCheckbox, ElScrollbar, ElUpload, ElProgress, ElCascader, ElTooltip, ElImage, ElDrawer, ElPopconfirm, ElTable, ElTableColumn, ElRadio, ElOptionGroup, ElInfiniteScroll, ElLoading, ElSwitch, ElAvatar, ElTabs, ElTabPane, ElDatePicker
} from 'element-plus'
import svgFont from './components/svgFont/index.vue'
import FButton from './components/element/FButton.vue'
import VueDragResize from 'vue-drag-resize'
import 'element-plus/dist/index.css'
import "./styles/publicStyle.scss" // 设置公共样式

const app = createApp(App)

// 按需引入element plus
const elementPlusArray = [ ElConfigProvider, ElButton, ElForm, ElFormItem, ElInput, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSelect, ElOption, ElIcon, ElDialog, ElMenu, ElMenuItem, ElCollapse, ElCollapseItem, ElCollapseTransition, ElPopover, ElRow, ElCol, ElTimeline, ElTimelineItem, ElCard, ElEmpty, ElDivider, ElInputNumber, ElCheckbox, ElScrollbar, ElUpload, ElProgress, ElCascader, ElTooltip, ElImage, ElDrawer, ElPopconfirm, ElTable, ElTableColumn, ElRadio, ElOptionGroup, ElInfiniteScroll, ElLoading, ElSwitch, ElAvatar, ElTabs, ElTabPane, ElDatePicker ]
elementPlusArray.forEach(item => {
    app.use(item)
})

// fontawesome 字体包引入
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPollH, faCalendarDay, faTrashCan, faTrashAlt, faBell, faSlidersH, faPlayCircle, faStopCircle, faSyncAlt, faPlusSquare, faEllipsisH, faQuoteLeft, faUndo, faEdit, faArrowDown, faArrowUp, faTimesCircle, faProjectDiagram, faHistory, faTrashRestore, faLayerGroup, faUser, faLock, faClock, faHashtag, faBold, faUnderline, faListUl, faListOl,  faFaceLaugh, faImage, faBook, faLink, faChevronCircleLeft, faFan, faCheckCircle, faInfoCircle, faArrowsAlt, faUserFriends, faCaretRight, faAngleDown, faAngleUp, faCodeMerge, faGripVertical, faPlus, faMinus, faThumbtack, faCog, faHdd, faEnvelopeOpenText, faStickyNote, faSync, faFileExport, faCheck, faRightLong, faCircle, faCircleXmark, faAngleRight, faChartBar, faBoxOpen, faGear, faXmark, faFileLines, faLightbulb, faAnglesLeft, faMaximize, faMinimize, faTags, faEye, faArrowDown19, faArrowDown91, faGrip } from '@fortawesome/free-solid-svg-icons'
import { faThemeco } from '@fortawesome/free-brands-svg-icons'
library.add( faPollH, faCalendarDay, faTrashCan, faTrashAlt, faBell, faSlidersH, faPlayCircle, faStopCircle, faSyncAlt, faPlusSquare, faEllipsisH, faQuoteLeft, faUndo, faThemeco, faEdit, faArrowDown, faArrowUp, faTimesCircle, faProjectDiagram, faHistory, faTrashRestore, faLayerGroup, faUser, faLock, faClock, faHashtag, faBold, faUnderline, faListUl, faListOl, faFaceLaugh, faImage, faBook, faLink, faChevronCircleLeft, faFan, faCheckCircle, faInfoCircle, faArrowsAlt, faUserFriends, faCaretRight, faAngleDown, faAngleUp, faCodeMerge, faGripVertical, faPlus, faMinus, faThumbtack, faCog, faHdd, faEnvelopeOpenText, faStickyNote, faSync, faFileExport, faCheck, faRightLong, faCircle, faCircleXmark, faAngleRight, faChartBar, faBoxOpen, faGear, faXmark, faFileLines, faLightbulb, faAnglesLeft, faMaximize, faMinimize, faTags, faEye, faArrowDown19, faArrowDown91, faGrip )

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
app.component("font-awesome-icon", FontAwesomeIcon)

app.component('svgFont', svgFont)
app.component('FButton', FButton)
app.component('vue-drag-resize', VueDragResize)



app.use(store).use(router).mount('#app')
