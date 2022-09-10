const actionGraph = require('service/action/graph.js')

// 获取笔记本
async function getCollectionGraphApi(data){
    return await actionGraph.collection(...Object.values(data || {}))
}

export default {
    getCollectionGraphApi
}
