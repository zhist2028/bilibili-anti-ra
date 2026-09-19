// 隐藏服务端渲染（SSR）直出的推荐内容。
// 网络层规则无法拦截随页面 HTML 一起下发的推荐数据，只能用样式隐藏。
const style = document.createElement("style");
style.id = "bili-anti-feed";
style.textContent = `
  /* 首页推荐流（含轮播图、“换一换”按钮、右下角“刷新内容”悬浮按钮） */
  .feed2,
  .floor-single-card,
  .flexible-roll-btn,

  /* 播放页右侧“接下来播放”推荐列表 */
  .recommend-list-v1,
  .recommend-list,
  .rec-list,
  .next-play,

  /* 番剧播放页右侧“相关推荐” */
  .plp-r [class*="recommend_wrap__"],

  /* 播放结束后播放器内残留的推荐容器（数据已被清空，隐藏空壳） */
  .bpx-player-ending-related,

  /* 热门 / 排行榜页面主体 */
  .popular-list,
  .rank-list {
    display: none !important;
  }
`;
(document.head || document.documentElement).appendChild(style);
