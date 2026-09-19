// 三种模式：
//   off       关闭——所有规则与脚本停用，B站完全恢复原样
//   block     屏蔽推荐——推荐接口直接拦截，页面上的推荐内容用 CSS/脚本隐藏
//   anonymous 匿名推荐——推荐照常展示，但请求不带 Cookie，算法拿不到用户画像
const MODES = ["off", "block", "anonymous"];
const BLOCK_RULE_IDS = [101, 102, 103, 104, 105];
const SCRIPT_IDS = ["hide-css", "scrub"];

const BADGES = {
  off: { text: "OFF", color: "#9e9e9e" },
  block: { text: "屏蔽", color: "#fb7299" },
  anonymous: { text: "匿名", color: "#00a1d6" },
};

async function registerContentScripts() {
  await chrome.scripting.registerContentScripts([
    {
      id: "hide-css",
      css: ["hide.css"],
      matches: ["https://www.bilibili.com/*"],
      runAt: "document_start",
    },
    {
      id: "scrub",
      js: ["scrub.js"],
      matches: [
        "https://www.bilibili.com/video/*",
        "https://www.bilibili.com/bangumi/play/*",
      ],
      runAt: "document_start",
      world: "MAIN",
    },
  ]);
}

async function unregisterContentScripts() {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: SCRIPT_IDS });
  } catch (e) {
    // 尚未注册时忽略
  }
}

async function applyMode(mode) {
  const badge = BADGES[mode];
  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });

  if (mode === "off") {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["bili_rules"],
    });
    await unregisterContentScripts();
    return;
  }

  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["bili_rules"],
  });

  if (mode === "block") {
    await chrome.declarativeNetRequest.updateStaticRules({
      rulesetId: "bili_rules",
      enableRuleIds: BLOCK_RULE_IDS,
    });
    await unregisterContentScripts();
    await registerContentScripts();
  } else {
    // anonymous：保留 Cookie 剥离与白名单规则，只关掉 block 规则
    await chrome.declarativeNetRequest.updateStaticRules({
      rulesetId: "bili_rules",
      disableRuleIds: BLOCK_RULE_IDS,
    });
    await unregisterContentScripts();
  }
}

async function getMode() {
  const { mode } = await chrome.storage.local.get("mode");
  return MODES.includes(mode) ? mode : "block";
}

chrome.runtime.onInstalled.addListener(async () => {
  const { mode } = await chrome.storage.local.get("mode");
  if (!MODES.includes(mode)) {
    await chrome.storage.local.set({ mode: "block" });
  }
  applyMode(await getMode());
});

chrome.runtime.onStartup.addListener(async () => {
  applyMode(await getMode());
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.mode) return;
  await applyMode(changes.mode.newValue);
  // 模式切换后刷新所有 B 站页面，让规则与脚本立即生效
  const tabs = await chrome.tabs.query({ url: "*://*.bilibili.com/*" });
  for (const tab of tabs) {
    chrome.tabs.reload(tab.id);
  }
});
