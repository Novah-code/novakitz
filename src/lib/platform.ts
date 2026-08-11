'use client';

import { Capacitor } from '@capacitor/core';

/** True inside the Capacitor shell, false on the web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
