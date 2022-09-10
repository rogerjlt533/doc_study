import request from "../utils/request.js"

export function generateApi(params){
    return request({
        url: "/api/tools/generate",
        method: "get",
        params
    })
}