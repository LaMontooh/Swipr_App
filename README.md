# Swipr

A React Native / Expo photo-cleanup app built from your original Swipr project. Swipe left to queue a photo for deletion, right to keep it, and make the final decision in Review.

## Your two versions

This is your active, updated Desktop copy at `/Users/lamonto611/Desktop/Final Swipr/Swipr`. Your original `SWIPR_APP ` project is still untouched. Before this Desktop copy was updated, its source was backed up as `Swipr-desktop-before-update-2026-10-15.zip` in the chat outputs. This version uses the same screen filenames and Firebase project and includes your saved iPhone signing-team setting.

## Try it

Open this **Swipr** folder in your editor, open a terminal there, and run:

```sh
npm ci
npm start
```

For a real photo library, use a native development build on your phone:

```sh
npm run ios
# Or, with an Android device/emulator:
npm run android
```

These commands generate native projects from `app.json`. Xcode is needed for iOS and Android Studio/the Android SDK for Android. An old build from the original app needs to be rebuilt so the photo permission configuration and new native dependencies take effect. Development builds provide the reliable path for photo-library permissions; Expo Go limitations vary by OS and installed SDK version.

To preview the interface in a browser:

```sh
npm run web
```

Choose **Take a quick look · demo** on the welcome screen. The demo uses five sample photos, keeps its own temporary progress, and never deletes files. Real device cleanup never uses these sample photos. A browser cannot clean an iPhone/Android camera roll.

## Firebase setup

Your original Firebase client configuration remains in `Firebase/firebase.jsx`. Email/password authentication must be enabled in the existing `swipr-cc934` Firebase project. The app uses the `users/{uid}` Firestore document for the username, a compressed profile avatar, and appearance preference. Photo-library images and cleanup history are not uploaded.

A reference `firestore.rules` file is included. In Firebase Console → Firestore Database → Rules, review it against your current rules and apply the `/users/{userId}` rule to this project's user collection. If your database has other collections, retain their intended rules. These rules have **not been deployed** from this chat; your existing live Firebase rules were not changed or verified. Profile sync errors appear in Settings rather than claiming a cloud save succeeded.

Avatars are cropped to a square and compressed to 256×256 JPEG before being stored in the private user document. This avoids a separate Firebase Storage bucket or billing setup. Usernames are validated as 3–15 letters, numbers, or underscores; they are display names and are not guaranteed unique.

## What is implemented

- Returning signed-in users go straight home. Existing users can log in directly without onboarding.
- Firebase sign-in persists on native devices; account creation, login, logout, and password reset have clear user-facing states.
- Saved username/avatar on the home screen; avatar opens an animated settings panel.
- Light, dark, and system appearance; local persistence and account preference sync.
- Photo-only permissions, including limited access and recovery after returning from phone settings.
- Real photo pagination; lazy metadata resolution for the visible cards.
- Drag gestures, Delete/Keep buttons, swipe feedback, and Undo.
- Saved keep/delete decisions per account on this device, including a persistent review tray.
- Two-step review confirmation and the OS deletion prompt. A failed/cancelled deletion does not add removed bytes.
- Daily reviewed/kept/deleted counts, a 25-photo goal, and measured photo data removed.
- Permission, empty library, cloud-photo preview, offline profile, and persistence error states.
- A separate browser demo for showing the design without account setup or library permissions.

## What the size counter means

“Cleaned today” sums the measured file sizes of **successfully deleted photos**. It does not claim the phone's free disk space instantly increased. Recently Deleted can retain files. Unknown sizes, cloud-only assets, and Live Photos are excluded from the byte sum instead of estimated. The Today panel reports how many deleted photos had unknown sizes.

Cleanup totals use the device's local day. History is account-specific **on this device**; it does not sync between devices. Uninstalling the app removes its local cleanup history. Profile details and appearance sync through Firestore.

## Checks and remaining verification

```sh
npm test
npm run format:check
npm run check
```

Automated tests cover the cleanup ledger and the deletion sequence: duplicate swipes, undo, local-day rollover, unknown sizes, success, cancellation, failed persistence, missing assets, and an empty queue.

Web/iOS/Android JavaScript bundles were exported successfully with `--no-bytecode`. The supplied Mac's Hermes bytecode compiler was killed during the standard export, so this does **not** confirm a signed native build. The browser preview was checked at phone widths, including Review, Restore, Undo, daily progress, and theme switching.

Still verify on a real device with your own Firebase account: login across a cold restart, cross-device profile sync, limited permissions, iCloud photos, and OS deletion prompts. Use disposable photos for the first deletion test. This is implemented source ready for that validation, not an App Store / Play Store release or a claim of completed device testing.

The project stays on Expo SDK 54, updated within that SDK's compatible patch versions. Nonbreaking dependency fixes were applied. npm still reports inherited high/moderate advisories in this SDK/dependency tree; no critical advisories remained at the last check. A newer major Expo/React Native migration is a separate task before a public release.

## Learn your code

Screens keep their React layout and a named `styles` section at the bottom, like your original. JavaScript for Firebase, photos, and cleanup is grouped into small files, with comments where behavior matters. `npm run format` keeps the layout readable.

Documentation used for the implementation:

- [Expo SDK 54 Media Library](https://docs.expo.dev/versions/v54.0.0/sdk/media-library/)
- [Expo SDK 54 File System](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/)
- [Firebase user management](https://firebase.google.com/docs/auth/web/manage-users)

## Xcode 27 local build notes

The native dependency targets are normalized to Swipr's existing minimum of iOS 15.1. The `plugins/withMinimumIosVersion.cjs` config plugin keeps this correction in future generated Podfiles. This fixes outdated deployment versions declared by the AsyncStorage and SDWebImage resource bundles without changing the app's minimum or lowering any dependency's higher requirement.

For device signing, select the white **Swipr** entry under **TARGETS** in Xcode, open **Signing & Capabilities**, enable automatic signing, and select your own Apple account's team. If the list is empty, add the account in Xcode Settings → Accounts/Apple Accounts first. Signing identities are not supplied or selected by this project.

Older Expo SDK 54 command-line tools do not recognize Xcode 27's Device Hub. Build the existing `ios/Swipr.xcworkspace` directly in Xcode while `npm start` runs in Terminal. Resolving the deployment-target errors is not confirmation of a complete native build; account signing and the resulting device build still require verification.

## Icon font native dependency

`expo-font` is an explicit dependency pinned to the Expo SDK 54-compatible 14.x range, and its config plugin is included. Icon fonts require its native loader; a JavaScript-only reload cannot add a native module to an already installed app. After changing this dependency, update CocoaPods and rebuild/install the app from Xcode. If `ExpoFontLoader` is missing, screen modules that import the icons can also produce misleading Router default-export warnings; those screens already have default exports.


## Desktop path build fixes and native verification

The project remains in `Desktop/Final Swipr/Swipr`. Expo SDK 54 contains two shell-script quoting bugs when the project path has spaces. `scripts/fix-ios-paths.cjs` quotes the Constants script's directory lookup after dependency installation. The config plugin also repairs the Constants build phase and the app's resolved React Native bundling-script invocation. Both fixes survive native project regeneration.

On October 15, 2026, the Desktop project's iOS Debug build **succeeded in Xcode** for the selected iPhone destination after these fixes. This confirms the native build; launching and testing the app on the phone remains a separate step. Existing dependency warnings remain. The SDWebImage source shown by Xcode did not need to be changed.
