import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

function traverse(value, set = new Set()) {
  if (!isObject(value)) {
    return value;
  }

  if (set.has(value)) {
    return value;
  }

  set.add(value);
  for (let key in value) {
    traverse(value[key], set);
  }

  return value;
}

export function watch(source, cb) {
  let getter;
  if (isFunction(source)) {
    getter = source;
  } else if (isObject(source)) {
    if (!isReactive(source)) {
      return;
    }
    getter = () => traverse(source);
  } else {
    return;
  }
  let oldValue;
  let cleanup;

  const job = () => {
    cleanup && cleanup();
    let newValue = effect.run();
    cb(newValue, oldValue, (cb) => {
      cleanup = cb;
    });
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
}
