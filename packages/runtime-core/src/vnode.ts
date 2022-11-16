import { isObject, ShapeFlags } from "@vue/shared";

export const Text = Symbol("text");
export const Fragment = Symbol("fragment");

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

export function isVNode(value) {
  return value && value._v_isVNode ? true : false;
}

export function createVnode(type, props?: any, children?: any) {
  let shapeFlags =
    typeof type === "string"
      ? ShapeFlags.ELEMENT
      : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0;
  const vnode = {
    _v_isVNode: true,
    shapeFlags,
    el: null,
    type,
    key: props?.key,
    props,
    children,
  };

  if (children !== undefined) {
    if (Array.isArray(children)) {
      vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
    } else if(isObject(children)) {
      /** 插槽 */
      vnode.shapeFlags |= ShapeFlags.SLOTS_CHILDREN
    } else {
      vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}
