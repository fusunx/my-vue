import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

export function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    /** 类名 */
    patchClass(el, nextValue);
  } else if (key === "style") {
    /** 样式 */
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[A-Z]/.test(key)) {
    /** 事件 */
    patchEvent(el, key, nextValue);
  } else {
    /** 普通属性 */
    patchAttr(el, key, nextValue);
  }
}
