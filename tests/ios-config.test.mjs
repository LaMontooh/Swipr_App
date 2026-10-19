import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { updatePodfile } = require('../plugins/withMinimumIosVersion.cjs');
const generated = `target 'Swipr' do
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )
  end
end
`;
test('minimum iOS target fix stays inside the CocoaPods post-install hook and is idempotent', () => {
  const fixed = updatePodfile(generated);
  assert.match(fixed, /installer\.pods_project\.targets\.each/);
  assert.match(fixed, /Gem::Version\.new\(current\.to_s\) < minimum_ios/);
  assert.equal(updatePodfile(fixed), fixed);
  assert.ok(fixed.indexOf('minimum_ios =') < fixed.lastIndexOf('  end'));
});
test('an unfamiliar Podfile fails explicitly rather than silently losing the fix', () => {
  assert.throws(() => updatePodfile(''), /could not locate/);
});
