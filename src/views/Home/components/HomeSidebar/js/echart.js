import { nextTick, ref, computed } from "vue"
import * as echarts from "echarts/core"
import {
    TitleComponent,
    TooltipComponent,
    ToolboxComponent,
    LegendComponent,
    CalendarComponent,
    VisualMapComponent
} from "echarts/components"
import { GraphChart, HeatmapChart } from "echarts/charts"
import { CanvasRenderer } from "echarts/renderers"
import bus from "@/utils/bus"
import store from "@/store"
import request from "@/utils/mainRequest"
import { getDate, getLastDay } from "@/utils/tools"

echarts.use([TitleComponent, TooltipComponent, ToolboxComponent, LegendComponent, CalendarComponent, VisualMapComponent, GraphChart, HeatmapChart, CanvasRenderer])

const user_id = computed(() => store.state.user.userInfo.id)
const collectionItem = {
    name: '',
    id: ''
}

export async function getGraph(showKnowledgeGraph, item) {
    let links = []
    let nodes = []
    let categories = []
    collectionItem.name = item ? item.collection : store.state.notes.catalogActiveState.collectionTitle
    collectionItem.id = item ? item.id : store.state.notes.catalogActiveState.collectionActive

    request(
        {
            api: "getCollectionGraphApi",
            key: "getCollectionGraphApi",
            data: {
                user_id: user_id.value,
                collection_id: collectionItem.id,
            },
        },
        async (res) => {
            if (res.status_code === 200) {
                showKnowledgeGraph.value = true
                await nextTick()
                categories = res.data.node_list.map((item) => {
                    let obj = {}
                    obj.name = item.name
                    return obj
                })
                links = res.data.links.map((item, index) => {
                    item.source = typeof item.source == "number" ? `${item.source}` : item.source
                    item.target = typeof item.target == "number" ? `${item.target}` : item.target
                    return item
                })
                nodes = res.data.node_list.map((item, index) => {
                    item.id = `${item.id}`
                    item.symbolSize = item.value * 5 + item.value / 5
                    item.category = index
                    return item
                })

                echartsFun(links, nodes, categories, showKnowledgeGraph)
            }
        }
    )
}

let knowledgeGraphChart = null

function echartsFun(links, nodes, categories, showKnowledgeGraph) {
    let chartDom = document.getElementById("knowledgeGraphChart")
    knowledgeGraphChart = echarts.init(chartDom)
    let option

    option = {
        toolbox: {
            //工具栏。内置有导出图片，数据视图，动态类型切换，数据区域缩放，重置五个工具。
            show: true,
            right: "50px",
            feature: {
                saveAsImage: {
                    show: true,
                    name: `方寸笔迹-《${collectionItem.name}》-知识图谱`,
                    backgroundColor: "#fafafc",
                    pixelRatio: 5,
                }, //导出图片
                dataView: {show: false},
            },
        },
        legend: {
            show: false,
            data: categories,
            width: "70%",
        },
        color: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"],
        tooltip: {
            show: true,
        },
        series: [
            {
                type: "graph",
                layout: "force",
                force: {
                    layoutAnimation: categories.length > 100 ? true : false,
                    repulsion: 100,
                    gravity: 0.01,
                    edgeLength: 200,
                },
                focusNodeAdjacency: true,
                categories: categories,
                data: nodes,
                links: links,
                roam: true,
                label: {
                    show: true,
                    position: "bottom",
                    distance: 5,
                    fontSize: 12,
                    align: "center",
                    width: 50,
                },
                autoCurveness: 0.01, //多条边的时候，自动计算曲率
                edgeSymbol: ["circle"], //边两边的类型
                edgeSymbolSize: [2, 10],
                edgeLabel: {},

                emphasis: {
                    focus: "adjacency",
                    lineStyle: {
                        width: 10,
                    },
                },
            },
        ],
    }

    option && knowledgeGraphChart.setOption(option)

    knowledgeGraphChart.off("click")
    knowledgeGraphChart.on("click", function (e) {
        const data = e.data
        console.log("filterNoteList", data)
        if (data.id && data.name) {
            showKnowledgeGraph.value = false
            filterNoteList({
                id: data.id,
                tag: data.name,
            })
        }
    })

    window.addEventListener("resize", () => {
        knowledgeGraphChart.resize()
    })
}

export function closeEcharts() {
    window.removeEventListener("resize", () => {
        knowledgeGraphChart.resize()
    })
}

function filterNoteList({id, tag, group_id = undefined}) {
    bus.emit("setTagToEditor", {
        tag: tag,
    })
    store.commit("notes/CHANGE_FILTER_NOTE_PARAMS", {
        tag_id: id,
    })
    store.commit("notes/CHANGE_CATALOG_ACTIVE_STATE", {
        tagActive: id,
        tagTitle: `#${tag}`,
    })
    store.commit("user/SHOW_NOTICE", {data: false})
    bus.emit("clearSearchKeyword")
    bus.emit("handleMakeListTop")
}

/**
 * 日历关系图
 */
let cacheCollectionId = ""
let currentMonth = ""
let currentRange = []
export let loadCalendarDay = ref(false)
export function getCalendar(showCalendarDay) {
    loadCalendarDay.value = true
    if (cacheCollectionId !== collectionItem.id) {
        currentMonth = getDate("month")
        currentRange = [`${getDate("month")}-01`, `${getDate("month")}-${getLastDay(getDate("month"))}`]
    }

    getCalendarData(currentMonth).then(async (data) => {
        cacheCollectionId = collectionItem.id
        showCalendarDay.value = true
        await nextTick()
        calendarEcharts(data)
    })
}

/**
 * 日历关系图 下个月
 */
export function nextMonth() {
    loadCalendarDay.value = true
    let { month } = getOtherDate("next")
    getCalendarData(month).then((data) => {
        calendarEcharts(data)
    })
}

/**
 * 日历关系图 上个月
 */
export function previousMonth() {
    loadCalendarDay.value = true
    let {month} = getOtherDate("prev")
    getCalendarData(month).then((data) => {
        calendarEcharts(data)
    })
}

function getCalendarData(month) {
    return new Promise((resolve) => {
        request(
            {
                api: "getCalendarApi",
                key: "getCalendarApi",
                data: {
                    user_id: user_id.value,
                    note_type: 1,
                    collection_id: collectionItem.id,
                    from_time: '',
                    end_time: '',
                    month,
                    orderby_create: store.state.notes.notes.orderby_create
                },
            },
            async (res) => {
                if (res.status_code === 200) {
                    resolve(res.data)
                }
            }
        )
    })
}

function calendarEcharts(data) {
    let chartDom = document.getElementById("calendarChart")
    let calendarChart = echarts.init(chartDom)
    let option

    const graphData = data
    option = {
        width: 250,
        height: 250,
        tooltip: {
            formatter: function (e) {
                const dotHtml = `<span style="display:inline-block;vertical-align:middle;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${e.color}"></span>` // 定义第一个数据前的圆点颜色
                const textHtml = `<span>${e.data[0]}  记录了  <span style="font-weight:bold;color:${e.color}">${e.data[1]}</span>  条笔记，点击查看</span>`
                return `${dotHtml}${textHtml}`
            },
        },
        calendar: {
            top: 70,
            left: "center",
            orient: "vertical",
            cellSize: 24,
            dayLabel: {
                firstDay: 1,
                nameMap: "cn",
            },
            monthLabel: {
                show: false,
                nameMap: "cn",
            },
            yearLabel: {
                margin: 40,
                fontSize: 20,
                formatter: currentMonth,
            },
            splitLine: {
                show: false,
                lineStyle: {
                    color: "#cccccc",
                    width: 1,
                },
            },
            itemStyle: {
                normal: {
                    borderColor: "#eee",
                    borderWidth: 1,
                },
            },
            range: currentRange,
        },
        visualMap: {
            show: false,
            min: 0,
            max: 5,
            inRange: {
                color: ["#EFEFEF", "#7885D1", "#7C7C8F"],
            },
            seriesIndex: [0],
            orient: "horizontal",
        },
        series: [
            {
                type: "heatmap",
                coordinateSystem: "calendar",
                data: graphData,
            },
        ],
    }

    option && calendarChart.setOption(option)
    loadCalendarDay.value = false

    calendarChart.off("click")
    calendarChart.on("click", function (e) {
        const data = e.data
        store.commit("notes/CHANGE_FILTER_NOTE_PARAMS", {
            start_time: data[0],
            end_time: data[0],
        })
        store.commit("notes/CHANGE_CATALOG_ACTIVE_STATE", {
            start_time: data[0],
            end_time: data[0]
        })
        bus.emit("handleSearchNote", {
            keyword: ""
        })
    })
}

/**
 * 获取上个月或者下个月
 * type: prev 上个月  next 下个月
 * from_time 月份第一天
 * end_time 月份最后一天
 */
function getOtherDate(type) {
    let fromDate = "",
        endDate = "",
        year = Number(currentMonth.split("-")[0]),
        month = Number(currentMonth.split("-")[1])

    if (type === "prev") {
        month = month - 1
        if (month < 1) {
            year = year - 1
            month = 12
        }
    }
    if (type === "next") {
        month = month + 1
        if (month > 12) {
            year = year + 1
            month = 1
        }
    }

    if(month < 10){
        month = `0${month}`
    }

    currentMonth = `${year}-${month}`
    fromDate = `${year}-${month}-01`
    endDate = `${year}-${month}-${getLastDay(currentMonth)}`
    currentRange = [fromDate, endDate]

    return {
        month: `${year}-${month}`
    }
}
