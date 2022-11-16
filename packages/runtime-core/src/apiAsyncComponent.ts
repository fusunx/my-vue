import { ref } from "@vue/reactivity";
import { isFunction } from "@vue/shared";
import { h } from "./h";
import { Fragment } from "./vnode";

export const defineAsyncComponent = (source) => {
  if (isFunction(source)) {
    source = { loader: source };
  }

  const { loader, loadingComponent, errorComponent, delay, timeout, onError } =
    source;

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
            throw err
          }
        });
      };

      load()
        .then((v) => {
          Component = v;
          loaded.value = true;
        })
        .catch((err) => {
          error.value = false;
        })
        .finally(() => {
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
    },
  };
};
