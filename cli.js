#!/usr/bin/env node

"use strict";

const { green, red } = require("chalk");
const program = require("commander");
const pkg = require("./package.json");
const run = require("./run");

program
  .version(pkg.version, "-v, --version")
  .usage(
    "[options]\n\n  Version format: MAJOR.MINOR.PATCH (see: https://semver.org/)"
  )
  .option("--patch", "version when you make backwards-compatible bug fixes.")
  .option(
    "--minor",
    "version when you add functionality in a backwards-compatible manner"
  )
  .option("--major", "version when you make incompatible API changes")
  .option(
    "--prepatch [identifier]",
    "increments the patch version, then makes a prerelease (default: beta)"
  )
  .option(
    "--preminor [identifier]",
    "increments the minor version, then makes a prerelease (default: beta)"
  )
  .option(
    "--premajor [identifier]",
    "increments the major version, then makes a prerelease (default: beta)"
  )
  .option(
    "--prerelease [identifier]",
    "increments version, then makes a prerelease (default: beta)"
  )
  .option(
    "-m, --remote [remote]",
    "remote and branch. format: `upstream/branch`",
    /^[a-zA-Z0-9_~.-]+\/[a-zA-Z0-9_~.-]+$/
  )
  .on("--help", () => {
    console.log("\n  Tip:\n");
    console.log(
      "    You should run this script in the root directory of you project or run by npm scripts."
    );
    console.log("\n  Examples:\n");
    console.log(`    ${green("$")} renew-it --patch`);
    console.log(`    ${green("$")} renew-it --prepatch`);
    console.log(`    ${green("$")} renew-it --prepatch alpha`);
    console.log(`    ${green("$")} renew-it --patch --remote upstream/branch`);
    console.log("");
  })
  .parse(process.argv);

run(program).catch((err) => {
  console.error(`${red(err)}`);
  process.exit(1);
});
