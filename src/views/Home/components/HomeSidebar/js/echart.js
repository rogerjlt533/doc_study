import { nextTick } from "vue"
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    ToolboxComponent,
    LegendComponent
} from 'echarts/components';
import { GraphChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import bus from '@/utils/bus'
import store from '@/store'

echarts.use([
    TitleComponent,
    TooltipComponent,
    ToolboxComponent,
    LegendComponent,
    GraphChart,
    CanvasRenderer
]);

import { getCollectionGraphApi } from "@/apiDesktop/graph"

let collection = ''
export async function getGraph(user_id, item, showKnowledgeGraph){
    collection = item.collection
    let links = [];
    let nodes = [];
    let categories = [];

    const res = await getCollectionGraphApi({
        user_id: user_id,
        collection_id: item.id
    })
    if(res.status_code === 200){
        showKnowledgeGraph.value = true
        await nextTick()
        categories = res.data.node_list.map(item => {
            let obj = {}
            obj.name = item.name;
            return obj
        })
        links = res.data.links.map((item,index) => {
            item.source = typeof item.source ==  "number" ? `${item.source}` : item.source;
            item.target = typeof item.target ==  "number" ? `${item.target}` : item.target;
            return item;
        });
        nodes = res.data.node_list.map((item,index) => {
            item.id = `${item.id}`;
            item.symbolSize = item.value * 5 + (item.value / 5);
            item.category = index;
            return item
        });

        echartsFun(links, nodes, categories, showKnowledgeGraph);
    }
}

let myChart = null
function echartsFun(links, nodes, categories, showKnowledgeGraph){
    let chartDom = document.getElementById('myChart');
    myChart = echarts.init(chartDom);
    let option;

    option = {
        toolbox: { //工具栏。内置有导出图片，数据视图，动态类型切换，数据区域缩放，重置五个工具。
            show: true,
            right: "50px",
            feature: {
                saveAsImage: {
                    show: true,
                    name: `方寸笔迹-《${collection}》-知识图谱`,
                    backgroundColor: '#fafafc',
                    pixelRatio: 5
                }, //导出图片
                dataView: { show: false }
            }
        },
        legend: {
            show: false,
            data: categories,
            width: '70%'
        },
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
        tooltip: {
            show: true
        },
        series: [{
            type: 'graph',
            layout: 'force',
            force: {
                layoutAnimation: categories.length > 100 ? true : false,
                repulsion: 100,
                gravity: 0.01,
                edgeLength: 200
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
                width: 50
            },
            autoCurveness: 0.01, //多条边的时候，自动计算曲率
            edgeSymbol: ["circle"], //边两边的类型
            edgeSymbolSize: [2, 10],
            edgeLabel: {},

            emphasis: {
                focus: 'adjacency',
                lineStyle: {
                    width: 10
                }
            },
        }]
    };

    option && myChart.setOption(option);

    myChart.on("click", function (e) {
        const data = e.data
        console.log('filterNoteList', data)
        if(data.id && data.name){
            showKnowledgeGraph.value = false
            filterNoteList({
                id: data.id,
                tag: data.name
            })
        }
    })

    window.addEventListener("resize", () => {
        myChart.resize()
    });
}

export function closeEcharts(){
    window.removeEventListener("resize", () => {
        myChart.resize();
    });
}

function filterNoteList({id, tag, group_id = undefined}){
    setTimeout(() => {
        bus.emit("SET_TEXT_EDITOR_TAG", {
            tag: tag
        })
        // store.commit("notes/CHANGE_CLASSIFY_ACTIVED",{
        //     collectionTitle: store.state.notes.classifyObj.collectionTitle,
        //     groupTitle: '',
        //     tagTitle: `#${tag}`,
        //     tag_id: id,
        //     activedTag: id,
        //     activedGroup: group_id,
        //     collectionActived: store.state.notes.classifyObj.collectionActived,
        //     collection_id: store.state.notes.tagToCollectionId
        // })
        store.commit('notes/CHANGE_FILTER_NOTE_PARAMS', {
            tag_id: id
        })
        store.commit('notes/CHANGE_CATALOG_ACTIVE_STATE', {
            tagActive: id,
            tagTitle: `#${tag}`,
        })
        store.commit("user/SHOW_NOTICE",{data: false})
        bus.emit("CLEAR_KAYWORD")
        bus.emit("MAKE_LIST_TOP")
    })
}


