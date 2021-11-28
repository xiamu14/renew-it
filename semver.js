const semver = require("semver");
const { red } = require("chalk");

function getNewVersion(options, version) {
  const semverList = [
    ["patch", "Bump version "],
    ["minor", "Release version "],
    ["major", "Release major version "],
  ];
  const preSemverList = ["prepatch", "preminor", "premajor", "prerelease"];
  const metadata = {};

  /**
   *
   * @param {String} v old version
   * @param {String} release patch | minor | major | prepatch | premajor | preminor | prerelease
   * @param identifier
   */
  function increase(v, release, identifier) {
    return semver.inc(v, release, identifier);
  }

  semverList.forEach((sem) => {
    if (options[sem[0]]) {
      if (metadata.version) {
        console.error(
          `${red(
            "You specified more than one semver type, please specify only one!"
          )}`
        );
        process.exit(1);
      }
      const newVersion = increase(version, sem[0]);
      metadata.version = newVersion;
      metadata.tag = `v${newVersion}`;
      metadata.prefix = sem[1];
    }
  });

  preSemverList.forEach((sem) => {
    if (options[sem]) {
      if (metadata.version) {
        console.error(
          `${red(
            "You specified more than one semver type, please specify only one!"
          )}`
        );
        process.exit(1);
      }
      const identifier =
        typeof options[sem] === "boolean" ? "beta" : options[sem];
      const newVersion = increase(version, sem, identifier);
      metadata.version = newVersion;
      metadata.tag = `v${newVersion}`;
      metadata.prefix = `Prerelease ${identifier} version `;
    }
  });

  return metadata;
}

module.exports = getNewVersion;
