import { instance } from "./component";

export const provide = (key, value) => {
  let provides = instance.provides;
  /**
   * 一般来说实例继承它的父组件的 provides 对象，
   * 但是当它自己需要提供数据时，它用它父组件的 provides
   * 对象作为自己 provides 对象原型，这样在 inject 函数中，
   * 我们可以很轻松的在直接父组件中根据原型链找到注入的数据。
   */
  const parentProvides = instance.parent.provides;
  if (provides === parentProvides) {
    provides = instance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
};

export const inject = (key) => {
  if (instance) {
    const provides = instance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    }
  } else {
    console.warn(
      `inject() can only be used inside setup() or functional components.`
    );
  }
};
