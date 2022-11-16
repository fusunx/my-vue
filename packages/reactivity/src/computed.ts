import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect"

class ComputedRefImpl {
    public _effect: ReactiveEffect
    public _dirty = true
    public _v_isReadonly = true
    public _v_isRef = true
    public _value
    public dep = new Set
    constructor(getter, public setter){
        this._effect = new ReactiveEffect(getter, () => {
            if(!this._dirty){
                this._dirty = true
            }
            triggerEffects(this.dep)
        })
    }

    get value() {
        if(this._dirty) {
            this._value = this._effect.run()
            this._dirty = false
        }
        trackEffects(this.dep)
        return this._value
    }

    set value(newValue) {
        this.setter(newValue)
    }
}

export function computed(options) {
    let getter
    let setter
    if (isFunction(options)) {
        getter = options
        setter = () => {console.warn('no setter')}
    } else {
        getter = options.get
        setter = options.set
    }

    return new ComputedRefImpl(getter, setter)
} 