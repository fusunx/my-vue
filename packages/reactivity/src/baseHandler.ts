import { isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

export const enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
}

export type targetType = Record<any, string>;

export const baseHandler = {
  get(target: targetType, key: string, receiver: any): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    let result = Reflect.get(target, key, receiver);
    if (isObject(result)) {
      return reactive(result as targetType);
    }
    track(target, key as string, "get");
    return result;
  },
  set(target: targetType, key: string, value: any, receiver: any) {
    if (target[key] === value) {
      return true;
    }
    let result = Reflect.set(target, key, value, receiver);
    trigger(target, key as string, "set", value);
    return result;
  },
};
