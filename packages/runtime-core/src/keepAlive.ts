import { ShapeFlags } from "@vue/shared";
import { onMounted, onUpdated } from "./apiLifeCircle";
import { getCurrentInstance } from "./component";

function resetFlag(vnode) {
  if (vnode.shapeFlags & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    vnode.shapeFlags -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }

  if (vnode.shapeFlags & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    vnode.shapeFlags -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
}

export const KeepAlive = {
  // 标识 keep-alive 组件
  __isKeepAlive: true,
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const { createElement, move, unmount } = instance.ctx.renderer;
    const keys = new Set();

    const pruneCacheEntry = (vnode) => {
      const subTree = cache.get(vnode);
      resetFlag(vnode);
      unmount(subTree, instance);
      cache.delete(vnode);
      keys.delete(vnode);
    };

    const cache = new Map();

    let storageContainer = createElement("div");

    instance.ctx.active = (n2, container, anchor) => {
      move(n2, container, anchor);
    };

    instance.ctx.deactivate = (n1) => {
      move(n1, storageContainer);
    };

    let pendingCacheKey = null;

    const cacheSubtree = () => {
      cache.set(pendingCacheKey, instance.subTree);
    };

    onMounted(cacheSubtree);
    onUpdated(cacheSubtree);

    return () => {
      const vnode = slots.default();

      /** 不是组件就不用缓存了 */
      if (!(vnode.shapeFlags & ShapeFlags.COMPONENT)) {
        return vnode;
      }

      const key = vnode.key || vnode.type; // 组件本身

      pendingCacheKey = key;

      const cacheVnode = cache.get(key);

      if (cacheVnode) {
        /** 命中缓存 */
        vnode.component = cacheVnode.component;
        /** 挂载的时候缓存, 不需要初始化 */
        vnode.shapeFlags |= ShapeFlags.COMPONENT_KEPT_ALIVE;
      } else {
        keys.add(key);
        const { max } = props;
        if (max && keys.size > max) {
          pruneCacheEntry(keys.values().next().value);
        }
      }

      /** 标识组件卸载的时候缓存 */
      vnode.shapeFlags |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;

      return vnode;
    };
  },
};
