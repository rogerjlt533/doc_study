const circleParse = (node, images) => {
    const content = node.content
    const length = content?.length
    if (node.type === 'blockquote') {
        const items = []
        if (length > 0) {
            for (const index in content) {
                if (content[index].type === 'image') {
                    items.push(content[index])
                } else {
                    const node_images = []
                    const unit_result = circleParse(content[index], node_images)
                    items.push(unit_result.node)
                    if (unit_result.images.length > 0) {
                        for (const image of unit_result.images) {
                            items.push(image)
                        }
                    }
                }
            }
        }
        node.content = items
    } else if (node.type === 'image') {
        images.push(node)
    } else if (length > 0) {
        const items = []
        for (const index in content) {
            if (content[index].type === 'image') {
                images.push(content[index])
            } else {
                const unit_result = circleParse(content[index], images)
                items.push(unit_result.node)
            }
        }
        node.content = items
    }
    return {node, images}
}

export const convertJson = (json) => {
    if (json.type !== 'doc') {
        return {}
    }
    const content = json.content
    const length = content?.length
    const items = []
    if (length > 0) {
        for (const index in content) {
            if (content[index].type === 'image') {
                items.push(content[index])
            } else {
                const content_images = []
                const {node, images} = circleParse(content[index], content_images)
                console.log('node', node)
                items.push(node)
                if (images.length > 0) {
                    for (const image of images) {
                        items.push(image)
                    }
                }
            }
        }
        json.content = items
    }
    return json
}


export function fixTipTapContent(html) {
    let container = document.createElement('div')
    container.innerHTML = html

    let el
    // 用a标签包裹的img
    while ((el = container.querySelector('a > img'))) {
        unwrapLink(el)
    }

    // 将a标签中的img移出去
    while (container.querySelector('p > a') && container.querySelector('p > img')) {
        el = container.querySelector('p > img')
        unwrap(el)
    }

    // 将P标签中的img移出去
    while ((el = container.querySelector('p > img'))) {
        unwrap(el)
    }

    // 将H标题中的img移出去
    while ((el = container.querySelector('h1 > img'))) {
        unwrap(el)
    }
    while ((el = container.querySelector('h2 > img'))) {
        unwrap(el)
    }
    while ((el = container.querySelector('h3 > img'))) {
        unwrap(el)
    }
    while ((el = container.querySelector('h4 > img'))) {
        unwrap(el)
    }
    while ((el = container.querySelector('h5 > img'))) {
        unwrap(el)
    }
    while ((el = container.querySelector('h6 > img'))) {
        unwrap(el)
    }

    return container.innerHTML
}


/**
 * 将所有 chldren 移出一个元素，并移除该元素。
 */
function unwrap(el) {
    let parent = el.parentNode.parentNode

    parent.insertBefore(el, el.parentNode.nextSibling)

    // 将所有子元素移动到父元素。
    // while (el.firstChild) {
    //     parent.insertBefore(el.firstChild, el)
    // }

    // 删除空元素。
    // parent.removeChild(el)
}


/**
 * 将所有 chldren 移出锚点，并设置替换文本。
 */
function unwrapLink(el) {
    let parent = el.parentNode.parentNode
    const fatherNode = el.parentNode

    parent.insertBefore(el, el.parentNode.nextSibling)

    // 将锚点保留在 dom 中，但由于它是空的，我们将 设置替换文本。
    fatherNode.textContent = fatherNode.href
}

