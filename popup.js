const radios = document.querySelectorAll('input[name="mode"]');
const labels = document.querySelectorAll("label[data-mode]");

function refresh(mode) {
  labels.forEach((label) => {
    label.classList.toggle("checked", label.dataset.mode === mode);
  });
  radios.forEach((radio) => {
    radio.checked = radio.value === mode;
  });
}

chrome.storage.local.get("mode").then(({ mode }) => {
  refresh(mode || "block");
});

radios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    chrome.storage.local.set({ mode: radio.value });
    refresh(radio.value);
  });
});
