# A guided look at your Swipr code

Your original screen structure is still here:

```text
app/
  _layout.jsx      App-wide providers, navigation, and status bar
  index.jsx        Welcome screen
  onboarding.jsx  Introduction for new users
  login.jsx       Login screen entry
  signup.jsx      Signup screen entry
  home.jsx        Your photo-swiping screen
Firebase/
  firebase.jsx    Your original Firebase project, plus persistent native login
src/
  components/     Shared visual pieces and account/settings/review panels
  context/        Account, saved profile, and appearance state
  hooks/          The real photo-library session
  lib/            Small JavaScript functions for data, files, and deletion
```

## React, JavaScript, and styles

This is **React Native**, so your “CSS” is JavaScript passed to `StyleSheet.create()`, as it was in your original app. A separate browser CSS file would not style the native phone app. The code is formatted with consistent indentation; the styles stay visible and editable at the bottom of each screen/component.

Most files follow this order:

1. **Imports:** which tools the screen needs.
2. **JavaScript behavior:** state, callbacks, data calculations, and actions.
3. **React layout:** the JSX that describes what appears on screen.
4. **Styles:** named rules for layout, spacing, color, and typography.

For example, in `app/home.jsx`, the photo deck appears in the React layout. Its base look comes from `styles.photoCard`, defined near the bottom. Its current position/rotation comes from the gesture logic above the layout. Theme-dependent colors appear next to the JSX because the theme changes at runtime.

## Follow one swipe

1. The home screen's `PanResponder` watches a horizontal drag.
2. `forceSwipe()` animates the card offscreen and calls `session.swipe()`.
3. `usePhotoSession.js` saves a decision locally **before** advancing to the next card.
4. `cleanup.js` records left/right decisions. A left swipe only queues a photo.
5. Review shows that queue; restoring a photo removes its decision and brings it back.
6. On final confirmation, `deletePhotos.js` measures sizes, saves the measured queue, and requests OS deletion.
7. Only a successful OS result creates deletion events and changes the measured-byte counter.

This distinction is why your app will not claim it freed storage just because someone dragged a card left.

## Follow a login

`AuthScreen.jsx` calls Firebase's login/signup methods. `AppContext.jsx` listens for account changes and loads the matching saved profile. `app/index.jsx` sends a signed-in user directly home. `Firebase/firebase.jsx` uses AsyncStorage to restore native Firebase login between launches.

`login.jsx` and `signup.jsx` are intentionally short: they both use the same readable form component. You can open `src/components/AuthScreen.jsx` to see the actual inputs, actions, and styles in one place.

## Follow a profile edit

The avatar opens `SettingsPanel.jsx`. The image picker selects a photo, the image manipulator crops/compresses it, and `AppContext.saveProfile()` updates the display name, saves the local profile, and syncs the private Firestore document. If cloud sync fails, the UI says so.

## Follow dark mode

The light/dark palettes are defined near the top of `AppContext.jsx`. Components read the palette with `useApp()`. Choosing Light, Dark, or Auto changes the palette and saves the preference. Auto follows the phone's current appearance.

## Where to make common changes

| Change | File / place |
| --- | --- |
| Home heading or controls | `app/home.jsx`, React layout |
| Photo-card spacing, corners, or typography | `app/home.jsx`, `styles` at the bottom |
| Welcome screen | `app/index.jsx` |
| Intro wording | `app/onboarding.jsx`, `slides` array |
| Login/signup form | `src/components/AuthScreen.jsx` |
| Profile/settings dropdown | `src/components/SettingsPanel.jsx` |
| Review tray / daily detail | `src/components/ReviewSheet.jsx` |
| App colors | `src/context/AppContext.jsx`, `light` and `dark` palettes |
| Photo pagination and permissions | `src/hooks/usePhotoSession.js` |
| Photo URI / actual file size | `src/lib/media.js` |
| Decision counts and byte formatting | `src/lib/cleanup.js` |
| Safe deletion order | `src/lib/deletePhotos.js` |
| Native permission descriptions | `app.json` |

A useful learning exercise: change the heading or a card border radius, run the demo, then follow a swipe through the files above. Read `tests/deletion.test.mjs` to see how cancellation and failure are tested without deleting real photos.
