import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwnKey, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { LifecycleHooks } from "./apiLifeCircle";

export let instance = null;

export const getCurrentInstance = () => instance;
export const setCurrentInstance = (i) => (instance = i);

export const createComponentInstance = (vnode, parent) => {
  const instance = {
    /** 当前实例的上下文，用于存储信息 */
    ctx: {} as any, 
    /** 组件本身的数据 */
    data: null,
    /** 组件本身的虚拟节点 */
    vnode,
    /** render 产生的子节点 */
    subTree: null,
    /**  是否挂载过 */
    isMounted: false,
    /** render 函数 */
    render: null,
    /** 组件中用户写的 */
    propsOption: vnode.type.props || {},
    /** 用户接收的属性，创建虚拟节点的时候提供的 */
    props: {},
    /** 没有接收的属性 */
    attrs: {},
    /** 代理对象 */
    proxy: null,
    /** setup 返回的是对象时对这个属性赋值 */
    setupState: {},
    /** 组件插槽信息 */
    slots: {},
    /** 组件暴露给实例信息 */
    exposed: {},
    /** 父组件实例 */
    parent: parent || Object.create(null),
    provides: {},
    /** 生命周期 */
    [LifecycleHooks.BEFORE_MOUNT]: [],
    [LifecycleHooks.MOUNTED]: [],
    [LifecycleHooks.UPDATED]: [],
  };

  return instance;
};

const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};

  const options = instance.propsOption;

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];

      if (key in options) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }

  /** 内部用的是浅响应式 */
  instance.props = reactive(props);
  /** 默认是非响应式的 */
  instance.attrs = attrs;
};

const publicProperties = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
};

const instanceProxy = {
  get(target, key, receiver) {
    const { data, props, setupState } = target;
    if (setupState && hasOwnKey(setupState, key)) {
      return setupState[key];
    } else if (data && hasOwnKey(data, key)) {
      return data[key];
    } else if (props && hasOwnKey(props, key)) {
      return props[key];
    }

    const getter = publicProperties[key];
    if (getter) {
      return getter(target);
    }

    return null;
  },
  set(target, key, value, receiver) {
    const { data, props, setupState } = target;
    if (setupState && hasOwnKey(setupState, key)) {
      setupState[key] = value;
    } else if (data && hasOwnKey(data, key)) {
      data[key] = value;
    } else if (props && hasOwnKey(props, key)) {
      console.warn("can`t update props");
      return false;
    }
    return true;
  },
};

const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlags & ShapeFlags.SLOTS_CHILDREN) {
    /** 将用户的 children 映射到实例上 */
    instance.slots = children;
  }
};

export const setupComponent = (instance) => {
  const { type, props, children } = instance.vnode;
  const { data, render, setup } = type;

  initProps(instance, props);
  initSlots(instance, children);

  if (data) {
    /** data 必须为函数 */
    if (!isFunction(data)) {
      return console.warn("The data option must be function");
    }

    /** 给实例赋值 data */
    instance.data = reactive(data.call({}));
  }

  /** 存在 setup */
  if (setup) {
    const context = {
      emit: (eventName, ...args) => {
        const eName =
          "on" + eventName.slice(0, 1).toUpperCase() + eventName.slice(1);
        const exec = props[eName];
        if (exec && isFunction(exec)) {
          exec(...args);
        }
      },
      attrs: instance.attrs,
      slots: instance.slots,
      expose: (exposed) => {
        instance.exposed = exposed || {};
      },
    };

    setCurrentInstance(instance);
    const setupResult = setup(instance.props, context);
    setCurrentInstance(null);

    if (isFunction(setupResult)) {
      /** setup 返回值为函数 */
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      /** setup 返回值为对象 */
      instance.setupState = proxyRefs(setupResult);
    } else {
      console.warn("setup type error");
    }
  }

  instance.proxy = new Proxy(instance, instanceProxy);

  if (!instance.render) {
    if (render) {
      instance.render = render;
    } else {
      /** 模板编译 */
    }
  }
};
