const fs = require('node:fs');
const path = require('node:path');

// Expo SDK 54's shell script splits PROJECT_DIR when a folder name has spaces.
// Apply this small quoting correction after installs; no app behavior changes.
function quoteProjectDirectory(contents) {
  return contents.replace(
    'PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)',
    'PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")',
  );
}
// The app target's bundling phase also needs to execute the resolved path as
// one quoted command, rather than splitting it at "Final Swipr".
function quoteReactNativeBundleScript(contents) {
  return contents.replace(
    /`("\$NODE_BINARY" --print [^\n]*react-native-xcode\.sh[^\n]*)`/g,
    (_, command) => '"$(' + command + ')"',
  );
}

function fixIosPaths() {
  const directory = path.dirname(require.resolve('expo-constants/package.json'));
  const filename = path.join(directory, 'scripts/get-app-config-ios.sh');
  const before = fs.readFileSync(filename, 'utf8');
  const after = quoteProjectDirectory(before);
  if (before !== after) fs.writeFileSync(filename, after);
  console.log('Checked Expo Constants script quoting for project paths with spaces.');
}
if (require.main === module) fixIosPaths();
module.exports = { quoteProjectDirectory, quoteReactNativeBundleScript };
