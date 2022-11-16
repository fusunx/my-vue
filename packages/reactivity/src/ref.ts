import { trackEffects, triggerEffects } from "./effect";
import { isReactive } from "./reactive";

class RefImpl {
  private _value;
  private _rawValue;
  public dep = new Set();
  public readonly __v_isRef = true;
  constructor(value) {
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
}

function isRef(value) {
  return !!(value && value.__v_isRef);
}

export function ref(value) {
  if (isRef(value)) {
    return value;
  }
  return new RefImpl(value);
}

export function toRefs(object) {
  const ret = Array.isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

class ObjectRefImpl {
  public readonly __v_isRef = true;
  constructor(private readonly object, private readonly key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}

export function toRef(object, key) {
  const val = object[key];
  return isRef(val) ? val : new ObjectRefImpl(object, key);
}

export function unref(ref) {
  return isRef(ref) ? ref.value : ref;
}

const shallowUnwrapHandlers = {
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
  },
};

export function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
