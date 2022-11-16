var VueReactivity = (() => {
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

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ReactiveEffect: () => ReactiveEffect,
    activeEffectScope: () => activeEffectScope,
    computed: () => computed,
    effect: () => effect,
    effectScope: () => effectScope,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    toRefs: () => toRefs,
    track: () => track,
    trackEffects: () => trackEffects,
    trigger: () => trigger,
    triggerEffects: () => triggerEffects,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (obj) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
  };
  var isFunction = (fn) => {
    return typeof fn === "function";
  };
  var extend = Object.assign;

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
      if (this.scopes) {
        this.scopes.forEach((scopeEffect) => scopeEffect.stop());
      }
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
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.iife.js.map
