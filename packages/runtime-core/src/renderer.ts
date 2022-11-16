import { ReactiveEffect } from "@vue/reactivity";
import { executeFns, ShapeFlags } from "@vue/shared";
import { LifecycleHooks } from "./apiLifeCircle";
import { createComponentInstance, instance, setupComponent } from "./component";
import { getSequence } from "./getSequence";
import { queueJob } from "./scheduler";
import { createVnode, isSameVNodeType, Text, Fragment } from "./vnode";

export function createRenderer(renderOptions) {
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
    patchProp: hostPatchProp,
  } = renderOptions;

  const patch = (n1, n2, container, anchor = null, parent = null) => {
    // 如果新老节点相同，直接返回
    if (n1 === n2) {
      return;
    }
    // 如果新老节点 type 和 key 不一致则不能复用节点，直接删除老节点
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
        if (shapeFlags & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parent);
        } else if (shapeFlags & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parent);
        }
        break;
    }
  };

  const processComponent = (n1, n2, container, anchor, parent) => {
    /**
     * 组件更新有两种方式
     * 1) 组件内部状态更新
     *    组件内部状态更新会触发对应 effect，直接更新组件
     * 2) 外部传入数据更新
     *    组件外部数据改变，通过修改 props，触发 effect
     */
    if (!n1) {
      if (n2.shapeFlags & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        /** 走 keep-alive 缓存 */
        parent.ctx.active(n2, container, anchor)
      } else {
        /** 初始化组价 */
        mountComponent(n2, container, anchor, parent);
      }
    } else {
      updateComponent(n1, n2);
    }
  };

  const updateComponentPreRender = (instance, next) => {
    /** 更新虚拟节点和 next */
    instance.next = null;
    instance.vnode = next;
    /** 更新 props */
    updateProps(instance, instance.props, next.props);
    Object.assign(instance.slots, next.children);
  };

  const setupRenderEffect = (instance, container, anchor, parent) => {
    const componentUpdate = () => {
      const { render } = instance;
      /** render 函数中的 this 既可以取到 props, 也可以取到 data，还可以取到 attrs */
      /** 初次渲染 */
      if (!instance.isMounted) {
        /** 组件最终要渲染的节点 */
        /** 这里调用 render 会进行依赖收集 */
        executeFns(instance[LifecycleHooks.BEFORE_MOUNT]);
        const subTree = render.call(instance.proxy);
        patch(null, subTree, container, anchor, instance);
        instance.isMounted = true;
        instance.subTree = subTree;
        executeFns(instance[LifecycleHooks.MOUNTED]);
      } else {
        /** 组件更新时缓存的最新 vnode */
        const next = instance.next;
        if (next) {
          /** 更新属性 */
          updateComponentPreRender(instance, next);
        }
        const subTree = render.call(instance.proxy);
        patch(instance.subTree, subTree, container, anchor, instance);
        instance.subTree = subTree;
        executeFns(instance[LifecycleHooks.UPDATED]);
      }
    };

    const effect = new ReactiveEffect(componentUpdate, () =>
      queueJob(instance.update)
    );

    const update = (instance.update = effect.run.bind(effect));
    update();
  };

  const mountComponent = (vnode, container, anchor, parent) => {
    // new Component => 组件实例

    // 1) 组件挂载前，需要产生一个组件的实例（对象），组件的状态、组件的属性、组件对应得生命周期
    const instance = (vnode.component = createComponentInstance(vnode, parent));

    instance.ctx.renderer = {
      createElement: hostCreateElement,
      move(vnode, container) {
        hostInsert(vnode.component.subTree.el, container);
      },
      unmount,
    };

    // 2) 组件的插槽，处理组件得属性。。 给组件实例赋值
    setupComponent(instance);
    // 3) 给组件产生一个 effect ，这样可以在组件数据变化后重新渲染
    setupRenderEffect(instance, container, anchor, parent);
  };

  /** 判断属性是否有变化 */
  const propsHasChange = (prevProps, nextProps) => {
    for (let key in nextProps) {
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }

    return false;
  };

  const updateProps = (instance, prevProps, nextProps) => {
    /** TODO : 如果属性个数不一样，直接更新 */
    for (let key in nextProps) {
      instance.props[key] = nextProps[key];
    }

    for (let key in prevProps) {
      if (!(key in nextProps)) {
        delete instance.props[key];
      }
    }
  };

  /** 判断 props 属性是否变化 */
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

  /** 组件更新逻辑 */
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    /** 新旧 props 属性不同才更新 */
    if (shouldUpdateComponent(n1, n2)) {
      /** 缓存最新 vnode */
      instance.next = n2;
      /** 强制更新 */
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }

    /**
     * props 是响应式的，更新 props 可以触发 effect，进而更新组件
     */
    // updateProps(instance, prevProps, nextProps)
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
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        hostSetElementText(el, n2.children);
      }
    }
  };

  const processElement = (n1, n2, container, anchor, parent) => {
    if (n1) {
      // 存在老的 VNode
      // 执行 patch 流程
      patchElement(n1, n2, parent);
    } else {
      // 不存在老的 VNode
      // 直接挂载
      mountElement(n2, container, anchor);
    }
  };

  const patchElement = (n1, n2, parent) => {
    const el = (n2.el = n1.el);
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

    // 老：文本 新：文本 操作：复用节点，设置文本
    // 老：文本 新：空  操作：卸载老节点
    // 老：文本 新：数组 操作：卸载老节点，挂载新节点数组
    // 老：空   新：文本 操作：挂载新节点
    // 老：空   新：空 操作：挂载新节点
    // 老：空   新：数组 操作：挂载新节点
    // 老：数组   新：文本 操作：卸载老节点，挂载新节点
    // 老：数组   新：空 操作：卸载老节点
    // 老：数组   新：数组 操作：diff

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      // 新：文本
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 老：数组 新：文本
        unmountChildren(c1, parent);
      }
      if (c1 !== c2) {
        // 老：文本或空 新：文本
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 老： 数组
        if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
          // 新： 数组
          patchKeyedChildren(c1, c2, container, parent);
        } else {
          // 新： 空
          unmountChildren(c1, parent);
        }
      } else {
        if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, "");
        }
        if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, container);
        }
      }
    }
  };

  const patchKeyedChildren = (c1, c2, container, parent) => {
    let e1 = c1.length - 1; // 老子数组最后一个元素位置
    let e2 = c2.length - 1; // 新子数组最后一个元素位置
    let l2 = c2.length; // 新子数组长度
    let i = 0;

    // sync from start
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

    // sync from end
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

    // common sequence + mount
    // 需要挂载
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, anchor, parent);
          i++;
        }
      }
    }

    // common sequence + unmount
    // 需要卸载
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i], parent);
          i++;
        }
      }
    }
    // unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      let s1 = i;
      let s2 = i;
      let toBePatched = e2 - s2 + 1;

      // 建立新子节点列表 key -> index map
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i] ? c2[i] : null;
        if (nextChild) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }

      // 移动节点
      // 遍历老节点，用老节点的 key 在 keyToNewIndexMap 中寻找对应新节点
      // 找到了就执行 patch，没找到就 unmount
      // 需要一个 newIndexToOldIndexMap 来关联老节点和新节点的位置，值为 0 说明为新增
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        let newIndex;
        if (prevChild.key) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // TODO
        }

        if (newIndex === undefined) {
          unmount(prevChild, parent);
        } else {
          // 加 1 的偏移量，防止下标为 0 的情况
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parent);
        }
      }
      // 老节点对应位置最长递增子序列
      const increment = getSequence(newIndexToOldIndexMap);

      // 插入子节点
      for (let i = newIndexToOldIndexMap.length - 1; i >= 0; i--) {
        const anchor = c2[i + s2 + 1].el ? c2[i + s2 + 1].el : null;
        const oldIndex = newIndexToOldIndexMap[i];
        const currentChild = c2[i + s2];
        if (oldIndex === 0) {
          patch(null, currentChild, container, anchor, parent);
        } else {
          // 当前 i 在递增序列中则跳过，否则插入到对应位置
          if (!increment.includes(i)) {
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

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
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

    if (shapeFlags & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      return parent.ctx.deactivate(n1)
    } else if (type === Fragment) {
      return unmountChildren(n1.children, parent);
    } else if (shapeFlags & ShapeFlags.COMPONENT) {
      return unmount(component.subTree, parent);
    }

    hostRemove(n1.el);
  };

  const unmountChildren = (children, parent) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i], parent);
    }
  };

  const render = (vnode, container) => {
    if (vnode) {
      patch(container._vnode || null, vnode, container);
    } else {
      if (container._vnode) {
        unmount(container._vnode, null);
      }
    }
    container._vnode = vnode;
  };
  return { render };
}
