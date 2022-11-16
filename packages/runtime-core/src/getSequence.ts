// 找出最长递归子序列
// 贪心 + 二分
export function getSequence(arr) {
  // 维持一个 result 存子序列
  // 值为数组下标，从 0 开始
  // 从左到右贪心匹配，如果后面一个元素比前面一个元素大，则放入 result
  // 存储最长递增子序列
  const result = [0];
  const len = arr.length;
  // 存储对应小标前面最长递增子序列最后一个元素地址
  const p = arr.slice();
  let u;
  let v;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      const j = result[result.length - 1];
      if (arrI > arr[j]) {
        p[i] = j;
        result.push(i);
        continue;
      }

      // 二分在 result 数组中找到比 arrI 大的第一个元素下标
      u = 0;
      v = result.length - 1;

      while (u < v) {
        // 取中点
        let c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }

      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }

  // 根据 p 中存储的前面最长递增子序列最后一个找到对应下标
  // 从 result 中最后一个开始，在 p 中找最长递增子序列上一个元素
  u = result.length;
  v = result[result.length - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }

  return result;
}
