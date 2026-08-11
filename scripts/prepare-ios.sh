#!/usr/bin/env bash
#
# Adds the Info.plist keys the app needs at runtime.
#
# `npx cap add ios` generates Info.plist from Capacitor's template, which does
# not carry app-specific usage strings. Editing it by hand works until someone
# regenerates the platform, so this runs as part of `npm run ios` instead and is
# safe to re-run — PlistBuddy Set overwrites, Add creates.
#
# Missing NSPhotoLibraryUsageDescription is not a warning: iOS terminates the
# app the moment the picker is presented, and App Review rejects for it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLIST="$ROOT/ios/App/App/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "==> No iOS project yet; run 'npx cap add ios' first. Skipping."
  exit 0
fi

set_string() {
  local key="$1" value="$2"
  if /usr/libexec/PlistBuddy -c "Print :$key" "$PLIST" >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :$key $value" "$PLIST"
  else
    /usr/libexec/PlistBuddy -c "Add :$key string $value" "$PLIST"
  fi
  echo "    $key"
}

echo "==> Writing Info.plist usage strings"

# Profile photos and dream image attachments both open the photo picker.
set_string NSPhotoLibraryUsageDescription \
  "Novakitz uses your photo library so you can set a profile picture and attach images to your dream entries."

# Both are required to dictate a dream: iOS refuses to start recognition without
# them and terminates the app if the microphone opens with either missing.
set_string NSMicrophoneUsageDescription \
  "Novakitz uses the microphone so you can speak a dream instead of typing it."

set_string NSSpeechRecognitionUsageDescription \
  "Novakitz converts your spoken dream into text so you can save it. The recording is transcribed on your device and is never uploaded."

echo "==> Info.plist ready"
