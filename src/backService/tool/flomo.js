const common = require('./common')
const fs = require('fs');
const parse5 = require('parse5')

/**
 * html
 * @param nodes
 * @returns {null}
 */
exports.getHtml = function(nodes) {
    for (const node of nodes) {
        if (node.nodeName === 'html') {
            return node
        }
    }
    return null
}

/**
 * body
 * @param nodes
 * @returns {null}
 */
exports.getBody = function (nodes) {
    for (const node of nodes) {
        if (node.nodeName === 'body') {
            return node
        }
    }
    return null
}

exports.existClass = function (node, className) {
    return node?.attrs && node.attrs.filter(item => item.name === 'class' && item.value === className).length > 0
}

/**
 * 获取memos
 * @param nodes
 * @returns {Array}
 */
exports.getMemos = function (nodes) {
    const memos = [], list = []
    for (const node of nodes) {
        if (node.nodeName === 'div' && this.existClass(node, 'memos')) {
            list.push(node)
        }
    }
    for (const item of list) {
        if (item.nodeName === 'div') {
            for (const memo of item.childNodes) {
                if (this.existClass(memo, 'memo')) {
                    memos.push(memo)
                }
            }
        }
    }
    return memos
}

exports.getNodeAttr = function(node, className) {
    if (node?.attrs) {
        const list = node.attrs.filter(item => item.name === 'class' && item.value === className)
        return list.length > 0 ? list[list.length - 1].value : null
    }
    return null
}

exports.getNodeValue = function(nodes, default_value = null) {
    for (const node of nodes) {
        if (/^\n\s+$/.test(node.value)) {
            continue
        }
        return node.value
    }
    return default_value
}

exports.getMemoContent = function(nodes, contents = []) {
    for (const node of nodes) {
        if (/^\n\s+$/.test(node.value)) {
            continue
        }
        let tagName = ''
        if (node.nodeName !== undefined) {
            if (node.nodeName !== '#text') {
                tagName = node.nodeName
            }
        }
        if (tagName !== '') {
            contents.push('<' + tagName + '>')
        }
        if (node?.value) {
            contents.push(node.value)
        }
        if (node?.childNodes) {
            this.getMemoContent(node?.childNodes ?? [], contents)
        }
        if (tagName !== '') {
            contents.push('</' + tagName + '>')
        }
    }
    return contents.join('')
}

exports.getMemoFiles = function(nodes) {
    const images = []
    for (const node of nodes) {
        if (node.nodeName !== 'img') {
            continue
        }
        if (node?.attrs) {
            node.attrs.filter(item => item.name === 'src').forEach(unit => images.push(unit.value))
        }
    }
    return images
}

exports.parseMemoNode = function (node, dirname) {
    const result = {status: false, dirname, time: null, content: '', tags: [], files: []}
    const items = node?.childNodes ?? []
    for (const item of items) {
        if (this.existClass(item, 'time')) {
            result.time = this.getNodeValue(item?.childNodes ?? [], null)
        } else if (this.existClass(item, 'content')) {
            result.content = this.getMemoContent(item?.childNodes ?? [])
        } else if (this.existClass(item, 'files')) {
            result.files = this.getMemoFiles(item?.childNodes ?? [])
        }
        result.status = true
    }
    result.content = result.content.replace(/\/#/g, ' #')
    result.content = common.processTagSpace(result.content)
    // result.content = result.content.replace(/<\/p>/g, ' </p>')
    // result.content = result.content.replace(/<\/span>/g, ' </span>')
    // result.content = result.content.replace(/<\/li>/g, ' </li>')
    // result.content = result.content.replace(/<\/strong>/g, ' </strong>')
    // result.content = result.content.replace(/<\/u>/g, ' </u>')
    const tags = result.content.match(/#(\S+?)?\s{1}/g)
    if (!common.empty(tags) && tags.length > 0) {
        for (let item of tags) {
            item = item.replace(/#/g, '')
            item = item.trim()
            if (common.empty(item)) {
                continue
            }
            result.tags.push(item)
        }
    }
    return result
}

/**
 * 解析目录成文件列表
 * @param dirname
 * @param contents
 * @returns {Promise<Array>}
 */
exports.analysisFiles = async function (dirname, contents = []) {
    const files = await fs.readdirSync(dirname)
    if (files !== null) {
        let html_list = [], directories = []
        for (let index in files) {
            let file = dirname.replace(/(\/*$)/g,"") + '/' + files[index]
            if (/.html/g.test(file)) {
                html_list.push(file)
            } else if (file === 'files') {
                continue
            } else if (fs.statSync(file).isDirectory()) {
                directories.push(file)
            }
        }
        if (html_list.length > 0) {
            for (const html of html_list) {
                const content = await fs.readFileSync(html, 'utf-8').toString()
                contents.push({dirname, content})
            }
        }
        for (const directory of directories) {
            await this.analysisFiles(directory, contents)
        }
    }
    return contents
}

/**
 * 解析目录成对象列表
 * @param dirname
 * @returns {Promise<Array>}
 */
exports.importFiles = async function (dirname) {
    const memo_list = []
    const contents = await this.analysisFiles(dirname)
    for (const content of contents) {
        const document = parse5.parse(content.content)
        const html = this.getHtml(document.childNodes)
        const body = this.getBody(html.childNodes)
        const memos = this.getMemos(body.childNodes)
        for (const memo of memos) {
            const memo_unit = this.parseMemoNode(memo, content.dirname)
            memo_list.push(memo_unit)
        }
    }
    return memo_list
}

