export const nodeOps = {
    /** 插入 DOM 节点 */
    insert(child, parent, anchor = null) {
        parent.insertBefore(child, anchor)
    },
    /** 删除 DOM 节点 */
    remove(child) {
        const parentNode = child.parentNode
        if(parentNode) {
            parentNode.removeChild(child)
        }
    },
    /** 设置文本 */
    setElementText(el, text) {
        el.textContent = text
    },
    /** 设置文本节点文本内容 */ 
    setText(node, text) {
        node.nodeValue = text
    },
    /** 查询 */
    querySelector(selector) {
        return document.querySelector(selector)
    },
    /** 查询父节点 */
    parentNode(node) {
        return node.parentNode
    },
    /** 查询兄弟节点 */
    nextSibling(node) {
        return node.nextSibling
    },
    /** 创建节点 */
    createElement(tagName) {
        return document.createElement(tagName)
    },
    /** 创建文本节点 */
    createText(text) {
        return document.createTextNode(text)
    }
}