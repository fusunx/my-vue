export const isObject = (obj: any): obj is object => {
  return Object.prototype.toString.call(obj) === '[object Object]'
};

export const isFunction = (fn: any): fn is Function => {
  return typeof fn === "function";
};

export const extend = Object.assign;

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwnKey = (target, key) => hasOwnProperty.call(target, key)

/** vue 中的形状标识 */
export const enum ShapeFlags {
  ELEMENT = 1,
  /** 函数式组件 */
  FUNCTIONAL_COMPONENT = 1 << 1,
  /** 带状态的组件 */
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}

export const executeFns = (fns = []) => {
  for(let i = 0; i < fns.length; i++) {
    fns[i]()
  }
}
