import { setCurrentInstance, instance } from "./component";

export const enum LifecycleHooks {
  BEFORE_CREATE = "bc",
  CREATED = "c",
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
  BEFORE_UNMOUNT = "bum",
  UNMOUNTED = "um",
  DEACTIVATED = "da",
  ACTIVATED = "a",
  RENDER_TRIGGERED = "rtg",
  RENDER_TRACKED = "rtc",
  ERROR_CAPTURED = "ec",
  SERVER_PREFETCH = "sp",
}

export const createLifeCircleHook = (lifecycle) => {
  return (hook) => {
    const cycles = instance[lifecycle] || []
    const wrapper = () => {
      setCurrentInstance(instance)
      hook.call(instance)
      setCurrentInstance(null)
    }
    cycles.push(wrapper)
    instance[lifecycle] = cycles
  }
};

export const onBeforeMount = createLifeCircleHook(LifecycleHooks.BEFORE_CREATE);
export const onMounted = createLifeCircleHook(LifecycleHooks.MOUNTED);
export const onUpdated = createLifeCircleHook(LifecycleHooks.UPDATED);
