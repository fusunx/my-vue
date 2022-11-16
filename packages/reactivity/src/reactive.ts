import { isObject } from "@vue/shared";
import { baseHandler, ReactiveFlags, targetType } from "./baseHandler";

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function reactive(obj: targetType) {
  if (!isObject(obj)) {
    throw new Error("reactive function only accept object ");
  }

  if (obj[ReactiveFlags.IS_REACTIVE]) {
    return obj;
  }

  const proxy = new Proxy(obj, baseHandler);

  return proxy;
}
