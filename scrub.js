// 在主世界拦截 __INITIAL_STATE__，抹掉其中的推荐数据。
// 页面先一次性赋值 __INITIAL_STATE__，随后再用属性赋值补写 related / rcmdTabNames，
// 因此不仅要拦 window 级赋值，还要把这些字段锁定为只读空值。
// 播放结束时的“相关推荐”面板与“自动连播推荐视频”都依赖 related / rcmdTabData，
// 合集连播走的是 sectionsInfo / ugc_season，不受影响。
(() => {
  const lockKey = (obj, key, fallback) => {
    let val = obj[key];
    if (Array.isArray(val)) {
      val = [];
    } else if (val && typeof val === "object") {
      if (Array.isArray(val.archives)) val.archives = [];
    } else {
      val = fallback;
    }
    Object.defineProperty(obj, key, {
      configurable: true,
      get() {
        return val;
      },
      set() {},
    });
  };

  const scrub = (v) => {
    try {
      if (v && typeof v === "object") {
        lockKey(v, "related", []);
        lockKey(v, "rcmdTabNames", []);
        lockKey(v, "rcmdTabData", { tab_name: "", archives: [], has_more: false });
      }
    } catch (e) {}
    return v;
  };

  let store;
  try {
    Object.defineProperty(window, "__INITIAL_STATE__", {
      configurable: true,
      get() {
        return store;
      },
      set(v) {
        store = scrub(v);
      },
    });
  } catch (e) {}
})();
