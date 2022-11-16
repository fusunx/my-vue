import { extend } from "@vue/shared";
import { recordEffectScope } from "./effectScope";

const targetMap = new WeakMap<object, Map<string, Set<ReactiveEffect>>>();

let activeEffect: ReactiveEffect | null;

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;

  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }

  effect.deps.length = 0;
}

export class ReactiveEffect {
  public deps: Array<Set<ReactiveEffect>> = [];
  public active = true;
  /** 嵌套 effect 场景进行缓存上一级 effect */
  public parent: null | ReactiveEffect = null;
  constructor(public fn: Function, public scheduler?: Function) {
    recordEffectScope(this)
  }
  run() {
    try {
      this.parent = activeEffect;
      activeEffect = this;
      // 在执行用户函数之前将之前的收集清空
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
}

export function effect(fn: Function, options: any) {
  const _effect = new ReactiveEffect(fn);

  if (options) {
    extend(_effect, options);
  }

  _effect.run();

  const runner: any = _effect.run.bind(_effect);

  runner.effect = _effect;

  return runner;
}

export function track(target: object, key: string, type: string) {
  let deps = targetMap.get(target);
  if (!deps) {
    targetMap.set(target, (deps = new Map<string, Set<ReactiveEffect>>()));
  }
  let dep = deps.get(key);
  if (!dep) {
    deps.set(key, (dep = new Set<ReactiveEffect>()));
  }
  trackEffects(dep);
}

export function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    if (activeEffect) {
      activeEffect.deps.push(dep);
      dep.add(activeEffect);
    }
  }
}

export function trigger(target: object, key: string, type: string, value: any) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  let effects = depsMap.get(key);
  triggerEffects(effects);
}

export function triggerEffects(effects) {
  if (effects) {
    effects = new Set(effects);
    effects.forEach((effect) => {
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          effect.scheduler();
        } else {
          effect.run();
        }
      }
    });
  }
}
