"use strict";

(() => {
  const measurementId = "G-88B9YPJXWP";
  if (location.protocol !== "https:") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
})();
