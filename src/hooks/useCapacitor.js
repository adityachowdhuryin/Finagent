import { useEffect, useState } from 'react';

// Safe Capacitor detection — works even when Capacitor is not installed
let Capacitor = null;
try {
  Capacitor = require('@capacitor/core').Capacitor;
} catch {}

export function useCapacitor() {
  const isNative = Capacitor?.isNativePlatform?.() ?? false;
  const platform = Capacitor?.getPlatform?.() ?? 'web'; // 'ios' | 'android' | 'web'

  // Haptic feedback (iOS/Android only)
  function hapticLight() {
    if (!isNative) return;
    try {
      const { Haptics, ImpactStyle } = require('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  }

  // Native share sheet
  async function shareContent(title, text, url) {
    if (!isNative) {
      // Web fallback
      if (navigator.share) {
        return navigator.share({ title, text, url });
      }
      await navigator.clipboard.writeText(url || text);
      return;
    }
    try {
      const { Share } = require('@capacitor/share');
      await Share.share({ title, text, url, dialogTitle: title });
    } catch {}
  }

  // Open external URL
  async function openUrl(url) {
    if (!isNative) {
      window.open(url, '_blank');
      return;
    }
    try {
      const { Browser } = require('@capacitor/browser');
      await Browser.open({ url });
    } catch {
      window.open(url, '_blank');
    }
  }

  return { isNative, platform, hapticLight, shareContent, openUrl };
}
