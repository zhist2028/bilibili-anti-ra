const RULESET_ID = "bili_rules";

async function refreshBadge() {
  const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
  const on = enabled.includes(RULESET_ID);
  await chrome.action.setBadgeText({ text: on ? "ON" : "OFF" });
  await chrome.action.setBadgeBackgroundColor({ color: on ? "#00a1d6" : "#9e9e9e" });
}

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);

chrome.action.onClicked.addListener(async () => {
  const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
  const on = enabled.includes(RULESET_ID);
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    on ? { disableRulesetIds: [RULESET_ID] } : { enableRulesetIds: [RULESET_ID] }
  );
  await refreshBadge();
});
