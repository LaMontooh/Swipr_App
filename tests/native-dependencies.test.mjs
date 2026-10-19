import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const sdkVersions = require('expo/bundledNativeModules.json');
const semver = require('semver');

test('icon font is an explicit native dependency compatible with the project SDK', () => {
  assert.ok(
    packageJson.dependencies['expo-font'],
    'expo-font must be direct so native autolinking includes it',
  );
  const installed = require('expo-font/package.json').version;
  assert.ok(
    semver.satisfies(installed, sdkVersions['expo-font']),
    `expo-font ${installed} does not match ${sdkVersions['expo-font']}`,
  );
  assert.ok(
    semver.subset(packageJson.dependencies['expo-font'], sdkVersions['expo-font']),
    'The font dependency must stay within this SDK’s supported range',
  );
});
