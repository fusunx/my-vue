export let activeEffectScope;

export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect);
  }
}

class EffectScope {
  public effects = [];
  public parent;
  public active = true;
  public scopes = [];
  constructor(detached) {
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this);
    }
  }
  run(fn) {
    try {
      this.parent = activeEffectScope;
      activeEffectScope = this;
      return fn(); // scope .run() 用户传入函数的返回值
    } finally {
      activeEffectScope = this.parent;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      this.effects.forEach((effect) => effect.stop());
    }
    this.scopes.forEach((scopeEffect) => scopeEffect.stop());
  }
}

export function effectScope(detached) {
  return new EffectScope(detached);
}
