#!/usr/bin/env node
const inquirer = require("inquirer");
const path = require("path");
const fs = require("fs");
const semver = require("semver");
const args = require("minimist")(process.argv.slice(2));
const { overwritePackageJson, execShell } = require("./utils");
const { green, cyan, magenta } = require("chalk");

async function exec() {
  const packageFile = path.resolve(process.cwd(), "package.json");

  let packageFileData;
  let version;

  try {
    packageFileData = fs.readFileSync(packageFile, "utf8");
    version = JSON.parse(packageFileData).version;
  } catch (err) {
    console.error(err);
    process.exit(1);
    // throw new Error("Can not find package.json in current work directory!");
  }

  // NOTE: 检验当前版本号是否合法
  if (!semver.valid(version)) {
    console.error(magenta("The current version number is invalid!"));
    process.exit(1);
  }

  console.log(green(`\nCurrent version: ${cyan(`${version}`)}`));

  const firstAnswer = await inquirer.prompt([
    {
      type: "confirm",
      name: "isRelease",
      message: "是否发布正式版？",
    },
  ]);

  const releaseTypes = [
    "[major]主版本(不向下兼容的修改)",
    "[minor]次版本(向下兼容的新增功能)",
    "[patch]修订号(向下兼容的问题修正)",
  ];
  const noReleaseTypes = [
    "[prerelease]升级先行版本号",
    "[premajor]主版本(不向下兼容的修改)",
    "[preminor]次版本(向下兼容的新增功能)",
    "[prepatch]修订号(向下兼容的问题修正)",
  ];

  const prereleaseVersions = [
    "[alpha]内部测试版",
    "[experimental]实验功能",
    "[beta]测试版，新功能迭代或修复 bug",
    "[rc]发行候选版本，无新功能迭代，仅修复 bug",
  ];

  const secondAnswer = await inquirer.prompt({
    type: "list",
    name: "type",
    message: "选择版本号?",
    choices: firstAnswer.isRelease ? releaseTypes : noReleaseTypes,
  });
  const versionType = secondAnswer.type.match(/\[(\w+)\]/)[1];
  let prereleaseVersionType = "";
  if (!firstAnswer.isRelease) {
    const thirdAnswer = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "选择先行版本号?",
      choices: prereleaseVersions,
    });
    prereleaseVersionType = thirdAnswer.type.match(/\[(\w+)\]/)[1];
  }

  // console.info("Answers:", versionType, prereleaseVersionType);

  const newVersion = semver.inc(version, versionType, prereleaseVersionType);
  const metadata = {
    version: newVersion,
    tag: `v${newVersion}`,
    prefix: `chore: `,
  };
  // console.log(`Update ${version} => ${newVersion}`);

  // 处理 upstream/branch
  let remote = ["origin", "master"];

  if (args["remote"]) {
    remote = args["remote"].split("/");
  }

  try {
    const msg = await overwritePackageJson(
      packageFile,
      packageFileData,
      version,
      newVersion
    );
    console.log(
      green(`\nUpdate version: ${cyan(`${version} -> ${metadata.version}`)}`)
    );
    console.log(
      green(
        `\nCommit message: ${cyan(`${metadata.prefix}${metadata.version}`)}`
      )
    );
    // process.exit(1);
    await execShell(metadata, remote[0], remote[1]);
    console.log("Push", remote.join("/"));
    console.log(`\n${green("[ renew-it ]")} Update Success!\n`);
  } catch (err) {
    throw err;
  }
}
if (args["help"] || args["h"]) {
  console.log("\n  Tip:\n");
  console.log(
    "    You should run this script in the root directory of you project or run by npm scripts."
  );
  console.log("\n  Examples:\n");
  console.log(`    ${green("$")} renew-it`);
  console.log(`    ${green("$")} renew-it --remote upstream/branch`);
  console.log("");
} else {
  exec();
}
