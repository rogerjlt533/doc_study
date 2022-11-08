import { filterSpecialFont } from './tools'

const matchReg = /\#(\S+?)?\s{1}/g
const str = '@|#-20*22-#|@'

export function handleContentHtml(contentHtml){
    contentHtml = handleHtmlTagSpace(contentHtml)
    const tagsArray = filterSpecialFont(contentHtml.match(matchReg))
    if(tagsArray){
        tagsArray.map((item) => {
            contentHtml = contentHtml.replace(item, str)
            if(item.indexOf('/') > 0 || item.indexOf('-') > 0){
                item = item.replace('#', '')
                let tagGroupArr = item.split(/[-/]/)
                tagGroupArr = tagGroupArr.map((tag) => {
                    tag = `<span data-type='mention' class='hashtag-suggestion' data-id='${tag.replace('#', '').trim()}'>#${tag}</span>`
                    return tag
                })
                let tagGroupItem = tagGroupArr.join('/')
                return tagGroupItem
            }else{
                return `<span data-type='mention' class='hashtag-suggestion' data-id='${item.replace('#', '').trim()}'>${item}</span>`
            }
        }).forEach((item) => {
            contentHtml = contentHtml.replace(str, item)
        })
    }

    return contentHtml
}

export function handleHtmlTagSpace(html){
    return html.replace(/<\/p>/g, " </p>").replace(/\s+?<\/p>/g, " </p>").replace(/\s+?<\/span>/g, " </span>").replace(/\/#/g, " /#")
}
