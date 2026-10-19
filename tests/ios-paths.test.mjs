import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const {
  quoteProjectDirectory,
  quoteReactNativeBundleScript,
} = require('../scripts/fix-ios-paths.cjs');
const { updatePodfile } = require('../plugins/withMinimumIosVersion.cjs');

test('Constants script recognizes Pods when the project directory contains spaces', () => {
  const line = quoteProjectDirectory('PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)');
  const result = spawnSync(
    'bash',
    ['-c', `${line}\nprintf '%s' "$PROJECT_DIR_BASENAME"`],
    {
      env: { ...process.env, PROJECT_DIR: '/tmp/Final Swipr/Swipr/ios/Pods' },
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'Pods');
  assert.equal(quoteProjectDirectory(line), line);
});

test('native regeneration includes a space-safe Constants phase even with an older minimum-target fix', () => {
  const existing = `target 'Swipr' do
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
    )
    # Swipr: keep dependency deployment targets compatible with Xcode 27.
  end
end`;
  const fixed = updatePodfile(existing);
  assert.ok(
    fixed.includes(
      `phase.shell_script = 'bash "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"'`,
    ),
  );
  assert.equal(updatePodfile(fixed), fixed);
});

test('the resolved React Native bundle script executes from a path containing spaces', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'Swipr-build-path-'));
  try {
    const nested = path.join(directory, 'Final Swipr');
    fs.mkdirSync(nested);
    const script = path.join(nested, 'react-native-xcode.sh');
    fs.writeFileSync(script, '#!/bin/bash\nprintf BUNDLE_SCRIPT_OK\n', { mode: 0o755 });
    const original =
      '`"$NODE_BINARY" --print "process.env.SWIPR_TEST_BUNDLE_SCRIPT /* react-native-xcode.sh */"`';
    const fixed = quoteReactNativeBundleScript(original);
    assert.notEqual(fixed, original);
    assert.equal(quoteReactNativeBundleScript(fixed), fixed);
    const result = spawnSync('bash', ['-c', fixed], {
      env: {
        ...process.env,
        NODE_BINARY: process.execPath,
        SWIPR_TEST_BUNDLE_SCRIPT: script,
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'BUNDLE_SCRIPT_OK');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
