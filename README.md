# B站推荐屏蔽 (Bilibili Anti-Feed)

一个 Chrome 扩展：登录哔哩哔哩后，**仅向白名单内的接口发送 Cookie**，对 `api.bilibili.com` 的其余所有请求一律剥离 Cookie（以匿名身份发出），从而让推荐算法拿不到你的画像。推荐接口会被进一步**直接拦截**；页面 HTML 里服务端渲染（SSR）直出的推荐内容则通过样式隐藏。

## 工作原理

三层防护（规则见 `rules.json`，隐藏样式见 `content.js`）：

| 层级 | 机制 | 作用 |
|---|---|---|
| 白名单 | DNR `allow` 规则（priority 2） | 命中的接口正常携带 Cookie |
| 删 Cookie | DNR `modifyHeaders` 移除 `cookie` 头（priority 1） | 作用于所有 `api.bilibili.com` 请求 + `www.bilibili.com` 页面文档请求；根据 Chrome 规则求值顺序，优先级低于 `allow` 时对白名单不生效 |
| 拦截推荐 | DNR `block` 规则（priority 1） | 首页推荐 / 相关推荐 / 热门 / 排行榜 / 追番推荐接口直接请求失败 |
| 隐藏 SSR 推荐 | content script 注入 CSS | 首页 HTML / 播放页 HTML 中服务端直出的推荐卡片无法靠网络层拦截，直接隐藏对应区域 |

注意：DNR 的 `modifyHeaders` 要求扩展同时拥有**请求目标**和**请求发起方**的 host 权限，因此 `host_permissions` 必须是整个 `*.bilibili.com`，只写 `api.bilibili.com` 会导致删 Cookie 静默失效。

另外：DNR 规则不匹配 `main_frame`（除非显式声明 `resourceTypes`），所以**把接口 URL 直接粘到地址栏打开的测试方式会绕过所有规则**，不能用来验证效果。正确验证方式：在 bilibili 页面控制台用 `fetch(..., {credentials:'include'})` 观察返回码（非白名单接口应返回 `-101 未登录`）。

## 白名单覆盖的功能

- **右上角按钮**：登录状态/头像（`x/web-interface/nav`、`nav/stat`）、消息未读数（`x/msgfeed/unread`）、动态入口（`x/web-interface/dynamic/entrance`）
- **个人中心**（`space.bilibili.com`）：`x/space/`、`x/polymer/web-space/` 全部接口，粉丝/关注数与关注操作（`x/relation/stat|modify`）
- **视频播放页**（除推荐外）：
  - 视频信息 `x/web-interface/view`（不含 `view/detail`，因为它内含推荐列表）
  - 播放地址/分 P/在线人数 `x/player/`、番剧播放 `pgc/player/`
  - 弹幕 `x/v1/dm/`、`x/v2/dm/`
  - 评论区 `x/v2/reply*`
  - 点赞/投币/收藏的状态与操作（`archive/has/like|coins|relation|like|like/tripple`、`coin/add`、`x/v2|v3/fav/`）
  - 观看历史与进度心跳（`x/v2/history/report`、`click-interface/web/heartbeat`）

## 被拦截/隐藏的内容

- `x/web-interface/(wbi/)?index/top/(feed/)?rcmd` — 首页推荐流（拦截 + 隐藏整个 `.feed2` 区域，含轮播、换一换、右下角"刷新内容"按钮）
- `x/web-interface/index/ogv/rcmd` — 首页追番/影视推荐（拦截）
- `x/web-interface/archive/related` — 播放页"接下来播放"（拦截 + 隐藏 `.recommend-list-v1` 等区域）
- `x/web-interface/popular*`、`x/web-interface/ranking*` — 热门、排行榜（拦截 + 隐藏页面列表）

## 安装

1. 打开 `chrome://extensions`，开启右上角"开发者模式"。
2. 点击"加载已解压的扩展程序"，选择本目录。
3. 扩展图标上的徽章显示 `ON`/`OFF`，点击图标可随时启用/停用整套规则。
4. 登录 B 站后使用。首页推荐区为空白；右上角头像、个人中心、视频播放与互动功能正常。

## 自定义

- **加白名单**：在 `rules.json` 里复制一条 `allow` 规则，换一个新的未使用的 `id` 和你的 `regexFilter`。注意正则走 RE2 语法，**不支持 lookahead**；路径锚定写法参考现有规则（结尾用 `([?/]|$)` 或 `([?]|$)` 防止前缀误伤，例如 `view` 与 `view/detail`、`archive/relation` 与 `archive/related` 的区分）。
- **不想拦截某个推荐接口、只想匿名**：删掉对应的 `block` 规则即可（此时该接口会以匿名身份返回通用榜单）。
- **想彻底放行某类接口**：把对应 `allow` 规则删掉，它就会回到"剥离 Cookie"的默认状态。
- **调整隐藏区域**：编辑 `content.js` 里的 CSS 选择器。
- 改完在 `chrome://extensions` 点扩展卡片上的"重新加载"。

## 预期行为与取舍

- 未加白的接口**不是报错而是匿名**：搜索、评论区、合集列表等仍然能用，只是不带登录态（例如不能发评论/发弹幕，如需可把对应接口加白）。
- 动态页（`t.bilibili.com`）的 feed 接口不在白名单内，会显示未登录；如需保留动态，把 `x/polymer/web-dynamic/` 加入白名单。
- `www.bilibili.com` 的页面文档请求也被剥离 Cookie（保证首页/播放页 SSR 不产出个性化内容）。页面本体功能不受影响——顶栏登录态由白名单内的 `nav` 接口恢复。
- 播放页右栏的活动横幅（如赛事推广）来自广告位接口，不属于推荐算法，未做处理。
