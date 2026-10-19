const { withPodfile, withXcodeProject } = require('@expo/config-plugins');
const { quoteReactNativeBundleScript } = require('../scripts/fix-ios-paths.cjs');

const marker = '# Swipr: keep dependency deployment targets compatible with Xcode 27.';
const pathMarker =
  '# Swipr: invoke the Constants script safely when the app path contains spaces.';

// Some libraries still declare iOS 9 or 13 even though Swipr requires iOS 15.1.
// Apply the app's minimum after CocoaPods generates the dependency targets.
function updatePodfile(contents) {
  if (contents.includes(marker) && contents.includes(pathMarker)) return contents;
  const anchor = /react_native_post_install\([\s\S]*?\n    \)/;
  if (!anchor.test(contents)) {
    throw new Error(
      'Swipr could not locate the CocoaPods post-install hook. Review the generated Podfile before building.',
    );
  }
  const hook = `

    ${marker}
    minimum_ios = Gem::Version.new(podfile_properties['ios.deploymentTarget'] || '15.1')
    installer.pods_project.targets.each do |pod_target|
      pod_target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || (current.to_s.match?(/\\A\\d+(?:\\.\\d+)*\\z/) && Gem::Version.new(current.to_s) < minimum_ios)
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_ios.to_s
        end
      end
    end`;
  let updated = contents.includes(marker)
    ? contents
    : contents.replace(anchor, (match) => match + hook);
  if (!updated.includes(pathMarker)) {
    const pathHook = `

    ${pathMarker}
    installer.pods_project.targets.each do |pod_target|
      next unless pod_target.name == 'EXConstants'
      pod_target.shell_script_build_phases.each do |phase|
        if phase.name.to_s.include?('Generate app.config')
          phase.shell_script = 'bash "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"'
        end
      end
    end`;
    updated = updated.replace(anchor, (match) => match + pathHook);
  }
  return updated;
}

// Xcode stores shell scripts as quoted strings in the project file.
function fixBundlePhases(project) {
  for (const phase of Object.values(
    project.hash.project.objects.PBXShellScriptBuildPhase || {},
  )) {
    if (!phase || typeof phase !== 'object' || typeof phase.shellScript !== 'string')
      continue;
    const contents = JSON.parse(phase.shellScript);
    phase.shellScript = JSON.stringify(quoteReactNativeBundleScript(contents));
  }
  return project;
}

// Run again on future Expo prebuilds, so the fixes survive native regeneration.
module.exports = function withMinimumIosVersion(config) {
  config = withXcodeProject(config, (mod) => {
    mod.modResults = fixBundlePhases(mod.modResults);
    return mod;
  });
  return withPodfile(config, (mod) => {
    mod.modResults.contents = updatePodfile(mod.modResults.contents);
    return mod;
  });
};
module.exports.updatePodfile = updatePodfile;

module.exports.fixBundlePhases = fixBundlePhases;
