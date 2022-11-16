import { isObject } from "@vue/shared";
import { createVnode, isVNode } from "./vnode";

export function h(type, props?, children?) {
  const l = arguments.length;

  if (l === 2) {
    // 当只有两个参数时
    // 第二个参数不为对象则为children
    if (isObject(props) && !Array.isArray(props)) {
      if(isVNode(props)) {
        return createVnode(type, null, [props]);
      }
      return createVnode(type, props);
    } else {
      return createVnode(type, null, props);
    }
  } else {
    //当参数数量不为两个时
    //有可能为一个或者三个
    //初始化参数，一个参数时透传
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVnode(type, props, children);
  }
}
