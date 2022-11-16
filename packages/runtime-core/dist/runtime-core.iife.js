var VueRuntimeCORE = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    Text: () => Text,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    h: () => h,
    isSameVNodeType: () => isSameVNodeType,
    isVNode: () => isVNode
  });

  // packages/shared/src/index.ts
  var isObject = (obj) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
  };
  var isFunction = (fn) => {
    return typeof fn === "function";
  };
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwnKey = (target, key) => hasOwnProperty.call(target, key);

  // packages/reactivity/src/effect.ts
  var targetMap = /* @__PURE__ */ new WeakMap();
  var activeEffect;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.deps = [];
      this.active = true;
      this.parent = null;
    }
    run() {
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function track(target, key, type) {
    let deps = targetMap.get(target);
    if (!deps) {
      targetMap.set(target, deps = /* @__PURE__ */ new Map());
    }
    let dep = deps.get(key);
    if (!dep) {
      deps.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      if (activeEffect) {
        activeEffect.deps.push(dep);
        dep.add(activeEffect);
      }
    }
  }
  function trigger(target, key, type, value) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    let effects = depsMap.get(key);
    triggerEffects(effects);
  }
  function triggerEffects(effects) {
    if (effects) {
      effects = new Set(effects);
      effects.forEach((effect2) => {
        if (effect2 !== activeEffect) {
          if (effect2.scheduler) {
            effect2.scheduler();
          } else {
            effect2.run();
          }
        }
      });
    }
  }

  // packages/reactivity/src/baseHandler.ts
  var baseHandler = {
    get(target, key, receiver) {
      if (key === "_v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      let result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result);
      }
      track(target, key, "get");
      return result;
    },
    set(target, key, value, receiver) {
      if (target[key] === value) {
        return true;
      }
      let result = Reflect.set(target, key, value, receiver);
      trigger(target, key, "set", value);
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  function isReactive(value) {
    return !!(value && value["_v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(obj) {
    if (!isObject(obj)) {
      throw new Error("reactive function only accept object ");
    }
    if (obj["_v_isReactive" /* IS_REACTIVE */]) {
      return obj;
    }
    const proxy = new Proxy(obj, baseHandler);
    return proxy;
  }

  // packages/reactivity/src/ref.ts
  function isRef(value) {
    return !!(value && value.__v_isRef);
  }
  function unref(ref2) {
    return isRef(ref2) ? ref2.value : ref2;
  }
  var shallowUnwrapHandlers = {
    get(target, key, receiver) {
      return unref(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  };
  function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
  }

  // packages/runtime-core/src/component.ts
  var createComponentInstance = (vnode) => {
    const instance = {
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      render: null,
      propsOption: vnode.type.props || {},
      props: {},
      attrs: {},
      proxy: null,
      setupState: {}
    };
    return instance;
  };
  var initProps = (instance, rawProps) => {
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
    instance.props = reactive(props);
    instance.attrs = attrs;
  };
  var publicProperties = {
    $attrs: (instance) => instance.attrs
  };
  var instanceProxy = {
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
    }
  };
  var setupComponent = (instance) => {
    const { type, props, children } = instance.vnode;
    const { data, render, setup } = type;
    initProps(instance, props);
    if (data) {
      if (!isFunction(data)) {
        return console.warn("The data option must be function");
      }
      instance.data = reactive(data.call({}));
    }
    if (setup) {
      const context = {
        emit: () => {
        },
        attrs: instance.attrs,
        slots: null
      };
      const setupResult = setup(instance.props, context);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
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
      }
    }
  };

  // packages/runtime-core/src/getSequence.ts
  function getSequence(arr) {
    const result = [0];
    const len = arr.length;
    const p = arr.slice();
    let u;
    let v;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        const j = result[result.length - 1];
        if (arrI > arr[j]) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          let c = u + v >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[result.length - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlushing = false;
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlushing) {
      isFlushing = true;
      Promise.resolve().then(() => {
        isFlushing = false;
        const copy = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copy.length; i++) {
          const job2 = copy[i];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("text");
  var Fragment = Symbol("fragment");
  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function isVNode(value) {
    return value ? value.__v_isVNode === true : false;
  }
  function createVnode(type, props, children) {
    let shapeFlags = typeof type === "string" ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      _v_isVNode: true,
      shapeFlags,
      el: null,
      type,
      key: props == null ? void 0 : props.key,
      props,
      children
    };
    if (children !== void 0) {
      if (!Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* TEXT_CHILDREN */;
      } else {
        vnode.shapeFlags |= 16 /* ARRAY_CHILDREN */;
      }
    }
    return vnode;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostText,
      querySelector: hostQuerySelector,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp
    } = renderOptions;
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVNodeType(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      switch (n2.type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container);
          break;
        default:
          const { shapeFlags } = n2;
          if (shapeFlags & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          } else if (shapeFlags & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor);
          }
          break;
      }
    };
    const processComponent = (n1, n2, container, anchor) => {
      if (!n1) {
        mountComponent(n2, container, anchor);
      } else {
        updateComponent(n1, n2);
      }
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance, instance.props, next.props);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const componentUpdate = () => {
        const { data, render: render2 } = instance;
        if (!instance.isMounted) {
          const subTree = render2.call(instance.proxy);
          patch(null, subTree, container, anchor);
          instance.isMounted = true;
          instance.subTree = subTree;
        } else {
          const next = instance.next;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          const subTree = render2.call(instance.proxy);
          patch(instance.subTree, subTree, container, anchor);
          instance.subTree = subTree;
        }
      };
      const effect2 = new ReactiveEffect(componentUpdate, () => queueJob(instance.update));
      const update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const mountComponent = (vnode, container, anchor) => {
      debugger;
      const instance = vnode.component = createComponentInstance(vnode);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const propsHasChange = (prevProps, nextProps) => {
      for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
          return true;
        }
      }
      return false;
    };
    const updateProps = (instance, prevProps, nextProps) => {
      for (let key in nextProps) {
        instance.props[key] = nextProps[key];
      }
      for (let key in prevProps) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    };
    const shouldUpdateComponent = (n1, n2) => {
      const prevProps = n1.props;
      const nextProps = n2.props;
      return propsHasChange(prevProps, nextProps);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.vnode = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      } else {
        n2.el = n1.el;
        instance.vnode = n2;
      }
    };
    const processFragment = (n1, n2, container) => {
      n2.el = n1 ? n1.el : hostCreateText("");
      if (n1) {
        patchChildren(n1, n2, container);
      } else {
        mountChildren(n2.children, container);
      }
    };
    const processText = (n1, n2, container) => {
      if (!n1) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else {
        const el = n2.el = n1.el;
        if (n2.children !== n1.children) {
          hostSetElementText(el, n2.children);
        }
      }
    };
    const processElement = (n1, n2, container, anchor) => {
      if (n1) {
        patchElement(n1, n2);
      } else {
        mountElement(n2, container, anchor);
      }
    };
    const patchElement = (n1, n2) => {
      const el = n2.el = n1.el;
      const oldProps = n1.props;
      const newProps = n2.props;
      for (let key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (!newProps[key]) {
          el[key] = null;
        }
      }
      patchChildren(n1, n2, el);
    };
    const patchChildren = (n1, n2, container) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlags = n1.shapeFlags;
      const shapeFlags = n2.shapeFlags;
      if (shapeFlags & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlags & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(container, c2);
        }
      } else {
        if (prevShapeFlags & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlags & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, container);
          } else {
            unmountChildren(c1);
          }
        } else {
          if (prevShapeFlags & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(container, "");
          }
          if (shapeFlags & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, container);
          }
        }
      }
    };
    const patchKeyedChildren = (c1, c2, container) => {
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      let l2 = c2.length;
      let i = 0;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = nextPos < l2 ? c2[nextPos].el : null;
          while (i <= e2) {
            patch(null, c2[i], container, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i]);
            i++;
          }
        }
      } else {
        let s1 = i;
        let s2 = i;
        let toBePatched = e2 - s2 + 1;
        const keyToNewIndexMap = /* @__PURE__ */ new Map();
        for (let i2 = s2; i2 <= e2; i2++) {
          const nextChild = c2[i2] ? c2[i2] : null;
          if (nextChild) {
            keyToNewIndexMap.set(nextChild.key, i2);
          }
        }
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
        for (let i2 = s1; i2 <= e1; i2++) {
          const prevChild = c1[i2];
          let newIndex;
          if (prevChild.key) {
            newIndex = keyToNewIndexMap.get(prevChild.key);
          } else {
          }
          if (newIndex === void 0) {
            unmount(prevChild);
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
            patch(prevChild, c2[newIndex], container);
          }
        }
        const increment = getSequence(newIndexToOldIndexMap);
        for (let i2 = newIndexToOldIndexMap.length - 1; i2 >= 0; i2--) {
          const anchor = c2[i2 + s2 + 1].el ? c2[i2 + s2 + 1].el : null;
          const oldIndex = newIndexToOldIndexMap[i2];
          const currentChild = c2[i2 + s2];
          if (oldIndex === 0) {
            patch(null, currentChild, container, anchor);
          } else {
            if (!increment.includes(i2)) {
              hostInsert(c1[oldIndex - 1].el, container, anchor);
            }
          }
        }
      }
    };
    const mountElement = (vnode, container, anchor) => {
      const { type, props, shapeFlags, children } = vnode;
      let el = null;
      if (vnode.el) {
        el = vnode.el;
      } else {
        el = vnode.el = hostCreateElement(type);
      }
      if (shapeFlags & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlags & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
      }
      if (props) {
        for (let key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      hostInsert(el, container, anchor);
    };
    const normalizeChild = (children, i) => {
      if (typeof children[i] === "string" || typeof children[i] === "number") {
        children[i] = createVnode(Text, null, children[i]);
      }
      return children[i];
    };
    const mountChildren = (children, container) => {
      for (let i = 0; i < children.length; i++) {
        const child = normalizeChild(children, i);
        patch(null, child, container);
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const render = (vnode, container) => {
      debugger;
      console.log(111);
      if (vnode) {
        patch(container._vnode || null, vnode, container);
      } else {
        if (container._vnode) {
          unmount(container._vnode);
        }
      }
      container._vnode = vnode;
    };
    return { render };
  }

  // packages/runtime-core/src/h.ts
  function h(type, props, children) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject(props)) {
        return createVnode(type, props);
      } else {
        return createVnode(type, null, props);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3) {
        if (isVNode(children)) {
          children = [children];
        }
      }
      return createVnode(type, props, children);
    }
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-core.iife.js.map
