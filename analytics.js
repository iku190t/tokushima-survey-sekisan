"use strict";

(() => {
  const measurementId = "G-88B9YPJXWP";
  const storageKey = "tokushima-sekisan-analytics-consent-v1";
  const banner = document.getElementById("analyticsConsent");
  const aboutDialog = document.getElementById("aboutToolDialog");
  let analyticsLoaded = false;

  function readConsent() {
    try { return localStorage.getItem(storageKey); } catch (_) { return null; }
  }

  function writeConsent(value) {
    try { localStorage.setItem(storageKey, value); } catch (_) { /* 保存不可でも現在の選択は反映する */ }
  }

  function gtag() { window.dataLayer.push(arguments); }

  function enableAnalytics() {
    if (analyticsLoaded || location.protocol === "file:") return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    gtag("js", new Date());
    gtag("config", measurementId, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function chooseConsent(value) {
    writeConsent(value);
    banner.hidden = true;
    if (value === "granted") enableAnalytics();
    else if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
  }

  function showPreferences() {
    if (location.protocol === "file:") return;
    banner.hidden = false;
  }

  document.getElementById("analyticsAcceptButton").addEventListener("click", () => chooseConsent("granted"));
  document.getElementById("analyticsDeclineButton").addEventListener("click", () => chooseConsent("denied"));
  document.getElementById("analyticsSettingsButton").addEventListener("click", () => {
    if (aboutDialog.open) aboutDialog.close();
    showPreferences();
  });
  document.getElementById("analyticsDetailsButton").addEventListener("click", () => {
    if (typeof aboutDialog.showModal === "function") aboutDialog.showModal();
    else aboutDialog.setAttribute("open", "");
  });

  const savedConsent = readConsent();
  if (savedConsent === "granted") enableAnalytics();
  else if (savedConsent !== "denied") showPreferences();
})();
