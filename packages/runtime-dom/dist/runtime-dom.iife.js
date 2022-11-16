var VueRuntimeDOM = (() => {
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

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    KeepAlive: () => KeepAlive,
    LifecycleHooks: () => LifecycleHooks,
    ReactiveEffect: () => ReactiveEffect,
    Text: () => Text,
    activeEffectScope: () => activeEffectScope,
    computed: () => computed,
    createLifeCircleHook: () => createLifeCircleHook,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    isSameVNodeType: () => isSameVNodeType,
    isVNode: () => isVNode,
    onBeforeMount: () => onBeforeMount,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    render: () => render,
    setCurrentInstance: () => setCurrentInstance,
    toRefs: () => toRefs,
    track: () => track,
    trackEffects: () => trackEffects,
    trigger: () => trigger,
    triggerEffects: () => triggerEffects,
    watch: () => watch
  });

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (!nextValue) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => {
      invoker.value();
    };
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      } else {
        el.removeEventListener(event, exits);
        invokers[eventName] = void 0;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue) {
    for (let key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (!nextValue[key]) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[A-Z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/shared/src/index.ts
  var isObject = (obj) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
  };
  var isFunction = (fn) => {
    return typeof fn === "function";
  };
  var extend = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwnKey = (target, key) => hasOwnProperty.call(target, key);
  var executeFns = (fns = []) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i]();
    }
  };

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope;
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  var EffectScope = class {
    constructor(detached) {
      this.effects = [];
      this.active = true;
      this.scopes = [];
      if (!detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      try {
        this.parent = activeEffectScope;
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        this.effects.forEach((effect2) => effect2.stop());
      }
      this.scopes.forEach((scopeEffect) => scopeEffect.stop());
    }
  };
  function effectScope(detached) {
    return new EffectScope(detached);
  }

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
      recordEffectScope(this);
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
  function effect(fn, options) {
    const _effect = new ReactiveEffect(fn);
    if (options) {
      extend(_effect, options);
    }
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
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

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._dirty = true;
      this._v_isReadonly = true;
      this._v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this._effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
        }
        triggerEffects(this.dep);
      });
    }
    get value() {
      if (this._dirty) {
        this._value = this._effect.run();
        this._dirty = false;
      }
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      this.setter(newValue);
    }
  };
  function computed(options) {
    let getter;
    let setter;
    if (isFunction(options)) {
      getter = options;
      setter = () => {
        console.warn("no setter");
      };
    } else {
      getter = options.get;
      setter = options.set;
    }
    return new ComputedRefImpl(getter, setter);
  }

  // packages/reactivity/src/watch.ts
  function traverse(value, set = /* @__PURE__ */ new Set()) {
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
  function watch(source, cb) {
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
      let newValue = effect2.run();
      cb(newValue, oldValue, (cb2) => {
        cleanup = cb2;
      });
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  var RefImpl = class {
    constructor(value) {
      this.dep = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = value;
      this._rawValue = value;
    }
    get value() {
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this._value) {
        triggerEffects(this.dep);
        this._rawValue = this._value;
        this._value = newValue;
      }
    }
  };
  function isRef(value) {
    return !!(value && value.__v_isRef);
  }
  function ref(value) {
    if (isRef(value)) {
      return value;
    }
    return new RefImpl(value);
  }
  function toRefs(object) {
    const ret = Array.isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      ret[key] = toRef(object, key);
    }
    return ret;
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
      this.__v_isRef = true;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function toRef(object, key) {
    const val = object[key];
    return isRef(val) ? val : new ObjectRefImpl(object, key);
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
  var instance = null;
  var getCurrentInstance = () => instance;
  var setCurrentInstance = (i) => instance = i;
  var createComponentInstance = (vnode, parent) => {
    const instance3 = {
      ctx: {},
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      render: null,
      propsOption: vnode.type.props || {},
      props: {},
      attrs: {},
      proxy: null,
      setupState: {},
      slots: {},
      exposed: {},
      parent: parent || /* @__PURE__ */ Object.create(null),
      provides: {},
      ["bm" /* BEFORE_MOUNT */]: [],
      ["m" /* MOUNTED */]: [],
      ["u" /* UPDATED */]: []
    };
    return instance3;
  };
  var initProps = (instance3, rawProps) => {
    const props = {};
    const attrs = {};
    const options = instance3.propsOption;
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
    instance3.props = reactive(props);
    instance3.attrs = attrs;
  };
  var publicProperties = {
    $attrs: (instance3) => instance3.attrs,
    $slots: (instance3) => instance3.slots
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
  var initSlots = (instance3, children) => {
    if (instance3.vnode.shapeFlags & 32 /* SLOTS_CHILDREN */) {
      instance3.slots = children;
    }
  };
  var setupComponent = (instance3) => {
    const { type, props, children } = instance3.vnode;
    const { data, render: render2, setup } = type;
    initProps(instance3, props);
    initSlots(instance3, children);
    if (data) {
      if (!isFunction(data)) {
        return console.warn("The data option must be function");
      }
      instance3.data = reactive(data.call({}));
    }
    if (setup) {
      const context = {
        emit: (eventName, ...args) => {
          const eName = "on" + eventName.slice(0, 1).toUpperCase() + eventName.slice(1);
          const exec = props[eName];
          if (exec && isFunction(exec)) {
            exec(...args);
          }
        },
        attrs: instance3.attrs,
        slots: instance3.slots,
        expose: (exposed) => {
          instance3.exposed = exposed || {};
        }
      };
      setCurrentInstance(instance3);
      const setupResult = setup(instance3.props, context);
      setCurrentInstance(null);
      if (isFunction(setupResult)) {
        instance3.render = setupResult;
      } else if (isObject(setupResult)) {
        instance3.setupState = proxyRefs(setupResult);
      } else {
        console.warn("setup type error");
      }
    }
    instance3.proxy = new Proxy(instance3, instanceProxy);
    if (!instance3.render) {
      if (render2) {
        instance3.render = render2;
      } else {
      }
    }
  };

  // packages/runtime-core/src/apiLifeCircle.ts
  var LifecycleHooks = /* @__PURE__ */ ((LifecycleHooks2) => {
    LifecycleHooks2["BEFORE_CREATE"] = "bc";
    LifecycleHooks2["CREATED"] = "c";
    LifecycleHooks2["BEFORE_MOUNT"] = "bm";
    LifecycleHooks2["MOUNTED"] = "m";
    LifecycleHooks2["BEFORE_UPDATE"] = "bu";
    LifecycleHooks2["UPDATED"] = "u";
    LifecycleHooks2["BEFORE_UNMOUNT"] = "bum";
    LifecycleHooks2["UNMOUNTED"] = "um";
    LifecycleHooks2["DEACTIVATED"] = "da";
    LifecycleHooks2["ACTIVATED"] = "a";
    LifecycleHooks2["RENDER_TRIGGERED"] = "rtg";
    LifecycleHooks2["RENDER_TRACKED"] = "rtc";
    LifecycleHooks2["ERROR_CAPTURED"] = "ec";
    LifecycleHooks2["SERVER_PREFETCH"] = "sp";
    return LifecycleHooks2;
  })(LifecycleHooks || {});
  var createLifeCircleHook = (lifecycle) => {
    return (hook) => {
      const cycles = instance[lifecycle] || [];
      const wrapper = () => {
        setCurrentInstance(instance);
        hook.call(instance);
        setCurrentInstance(null);
      };
      cycles.push(wrapper);
      instance[lifecycle] = cycles;
    };
  };
  var onBeforeMount = createLifeCircleHook("bc" /* BEFORE_CREATE */);
  var onMounted = createLifeCircleHook("m" /* MOUNTED */);
  var onUpdated = createLifeCircleHook("u" /* UPDATED */);

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
    return value && value._v_isVNode ? true : false;
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
      if (Array.isArray(children)) {
        vnode.shapeFlags |= 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        vnode.shapeFlags |= 32 /* SLOTS_CHILDREN */;
      } else {
        vnode.shapeFlags |= 8 /* TEXT_CHILDREN */;
      }
    }
    return vnode;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
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
    } = renderOptions2;
    const patch = (n1, n2, container, anchor = null, parent = null) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVNodeType(n1, n2)) {
        unmount(n1, parent);
        n1 = null;
      }
      switch (n2.type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parent);
          break;
        default:
          const { shapeFlags } = n2;
          if (shapeFlags & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parent);
          } else if (shapeFlags & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor, parent);
          }
          break;
      }
    };
    const processComponent = (n1, n2, container, anchor, parent) => {
      if (!n1) {
        if (n2.shapeFlags & 512 /* COMPONENT_KEPT_ALIVE */) {
          parent.ctx.active(n2, container, anchor);
        } else {
          mountComponent(n2, container, anchor, parent);
        }
      } else {
        updateComponent(n1, n2);
      }
    };
    const updateComponentPreRender = (instance3, next) => {
      instance3.next = null;
      instance3.vnode = next;
      updateProps(instance3, instance3.props, next.props);
      Object.assign(instance3.slots, next.children);
    };
    const setupRenderEffect = (instance3, container, anchor, parent) => {
      const componentUpdate = () => {
        const { render: render3 } = instance3;
        if (!instance3.isMounted) {
          executeFns(instance3["bm" /* BEFORE_MOUNT */]);
          const subTree = render3.call(instance3.proxy);
          patch(null, subTree, container, anchor, instance3);
          instance3.isMounted = true;
          instance3.subTree = subTree;
          executeFns(instance3["m" /* MOUNTED */]);
        } else {
          const next = instance3.next;
          if (next) {
            updateComponentPreRender(instance3, next);
          }
          const subTree = render3.call(instance3.proxy);
          patch(instance3.subTree, subTree, container, anchor, instance3);
          instance3.subTree = subTree;
          executeFns(instance3["u" /* UPDATED */]);
        }
      };
      const effect2 = new ReactiveEffect(componentUpdate, () => queueJob(instance3.update));
      const update = instance3.update = effect2.run.bind(effect2);
      update();
    };
    const mountComponent = (vnode, container, anchor, parent) => {
      const instance3 = vnode.component = createComponentInstance(vnode, parent);
      instance3.ctx.renderer = {
        createElement: hostCreateElement,
        move(vnode2, container2) {
          hostInsert(vnode2.component.subTree.el, container2);
        },
        unmount
      };
      setupComponent(instance3);
      setupRenderEffect(instance3, container, anchor, parent);
    };
    const propsHasChange = (prevProps, nextProps) => {
      for (let key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
          return true;
        }
      }
      return false;
    };
    const updateProps = (instance3, prevProps, nextProps) => {
      for (let key in nextProps) {
        instance3.props[key] = nextProps[key];
      }
      for (let key in prevProps) {
        if (!(key in nextProps)) {
          delete instance3.props[key];
        }
      }
    };
    const shouldUpdateComponent = (n1, n2) => {
      const prevProps = n1.props;
      const nextProps = n2.props;
      if (propsHasChange(prevProps, nextProps)) {
        return true;
      }
      if (n1.children || n2.children) {
        return true;
      }
      return false;
    };
    const updateComponent = (n1, n2) => {
      const instance3 = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance3.next = n2;
        instance3.update();
      } else {
        n2.el = n1.el;
        instance3.vnode = n2;
      }
    };
    const processFragment = (n1, n2, container, parent) => {
      n2.el = n1 ? n1.el : hostCreateText("");
      if (n1) {
        patchChildren(n1, n2, container, parent);
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
    const processElement = (n1, n2, container, anchor, parent) => {
      if (n1) {
        patchElement(n1, n2, parent);
      } else {
        mountElement(n2, container, anchor);
      }
    };
    const patchElement = (n1, n2, parent) => {
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
      patchChildren(n1, n2, el, parent);
    };
    const patchChildren = (n1, n2, container, parent) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlags = n1.shapeFlags;
      const shapeFlags = n2.shapeFlags;
      if (shapeFlags & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlags & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1, parent);
        }
        if (c1 !== c2) {
          hostSetElementText(container, c2);
        }
      } else {
        if (prevShapeFlags & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlags & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, container, parent);
          } else {
            unmountChildren(c1, parent);
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
    const patchKeyedChildren = (c1, c2, container, parent) => {
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      let l2 = c2.length;
      let i = 0;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, container, parent);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, container, parent);
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
            patch(null, c2[i], container, anchor, parent);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i], parent);
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
            unmount(prevChild, parent);
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
            patch(prevChild, c2[newIndex], container, parent);
          }
        }
        const increment = getSequence(newIndexToOldIndexMap);
        for (let i2 = newIndexToOldIndexMap.length - 1; i2 >= 0; i2--) {
          const anchor = c2[i2 + s2 + 1].el ? c2[i2 + s2 + 1].el : null;
          const oldIndex = newIndexToOldIndexMap[i2];
          const currentChild = c2[i2 + s2];
          if (oldIndex === 0) {
            patch(null, currentChild, container, anchor, parent);
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
    const unmount = (n1, parent) => {
      const { type, shapeFlags, component } = n1;
      if (shapeFlags & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
        return parent.ctx.deactivate(n1);
      } else if (type === Fragment) {
        return unmountChildren(n1.children, parent);
      } else if (shapeFlags & 6 /* COMPONENT */) {
        return unmount(component.subTree, parent);
      }
      hostRemove(n1.el);
    };
    const unmountChildren = (children, parent) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i], parent);
      }
    };
    const render2 = (vnode, container) => {
      if (vnode) {
        patch(container._vnode || null, vnode, container);
      } else {
        if (container._vnode) {
          unmount(container._vnode, null);
        }
      }
      container._vnode = vnode;
    };
    return { render: render2 };
  }

  // packages/runtime-core/src/h.ts
  function h(type, props, children) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject(props) && !Array.isArray(props)) {
        if (isVNode(props)) {
          return createVnode(type, null, [props]);
        }
        return createVnode(type, props);
      } else {
        return createVnode(type, null, props);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVNode(children)) {
        children = [children];
      }
      return createVnode(type, props, children);
    }
  }

  // packages/runtime-core/src/apiInject.ts
  var provide = (key, value) => {
    let provides = instance.provides;
    const parentProvides = instance.parent.provides;
    if (provides === parentProvides) {
      provides = instance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  };
  var inject = (key) => {
    if (instance) {
      const provides = instance.parent.provides;
      if (provides && key in provides) {
        return provides[key];
      }
    } else {
      console.warn(`inject() can only be used inside setup() or functional components.`);
    }
  };

  // packages/runtime-core/src/apiAsyncComponent.ts
  var defineAsyncComponent = (source) => {
    if (isFunction(source)) {
      source = { loader: source };
    }
    const { loader, loadingComponent, errorComponent, delay, timeout, onError } = source;
    return {
      setup() {
        const loaded = ref(false);
        const error = ref(false);
        const loading = ref(false);
        let Component = null;
        if (timeout) {
          setTimeout(() => {
            error.value = true;
          }, timeout);
        }
        if (delay) {
          setTimeout(() => {
            loading.value = true;
          }, delay);
        } else {
          loading.value = true;
        }
        const load = () => {
          return loader.catch((err) => {
            if (onError) {
              return new Promise((resolve, reject) => {
                let retry = () => resolve(load());
                let fail = () => reject();
                onError(retry, fail);
              });
            } else {
              throw err;
            }
          });
        };
        load().then((v) => {
          Component = v;
          loaded.value = true;
        }).catch((err) => {
          error.value = false;
        }).finally(() => {
          loading.value = false;
        });
        return () => {
          if (loaded.value) {
            return h(Component);
          } else if (error.value && errorComponent) {
            return h(errorComponent);
          } else if (loading.value && loadingComponent) {
            return h(loadingComponent);
          } else {
            return h(Fragment, []);
          }
        };
      }
    };
  };

  // packages/runtime-core/src/keepAlive.ts
  function resetFlag(vnode) {
    if (vnode.shapeFlags & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
      vnode.shapeFlags -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    if (vnode.shapeFlags & 512 /* COMPONENT_KEPT_ALIVE */) {
      vnode.shapeFlags -= 512 /* COMPONENT_KEPT_ALIVE */;
    }
  }
  var KeepAlive = {
    __isKeepAlive: true,
    setup(props, { slots }) {
      const instance3 = getCurrentInstance();
      const { createElement, move, unmount } = instance3.ctx.renderer;
      const keys = /* @__PURE__ */ new Set();
      const pruneCacheEntry = (vnode) => {
        const subTree = cache.get(vnode);
        resetFlag(vnode);
        unmount(subTree, instance3);
        cache.delete(vnode);
        keys.delete(vnode);
      };
      const cache = /* @__PURE__ */ new Map();
      let storageContainer = createElement("div");
      instance3.ctx.active = (n2, container, anchor) => {
        move(n2, container, anchor);
      };
      instance3.ctx.deactivate = (n1) => {
        move(n1, storageContainer);
      };
      let pendingCacheKey = null;
      const cacheSubtree = () => {
        cache.set(pendingCacheKey, instance3.subTree);
      };
      onMounted(cacheSubtree);
      onUpdated(cacheSubtree);
      return () => {
        const vnode = slots.default();
        if (!(vnode.shapeFlags & 6 /* COMPONENT */)) {
          return vnode;
        }
        const key = vnode.key || vnode.type;
        pendingCacheKey = key;
        const cacheVnode = cache.get(key);
        if (cacheVnode) {
          vnode.component = cacheVnode.component;
          vnode.shapeFlags |= 512 /* COMPONENT_KEPT_ALIVE */;
        } else {
          keys.add(key);
          const { max } = props;
          if (max && keys.size > max) {
            pruneCacheEntry(keys.values().next().value);
          }
        }
        vnode.shapeFlags |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        return vnode;
      };
    }
  };

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.iife.js.map
