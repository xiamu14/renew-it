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
    console.log("Can not parse package.json in current work directory!");
    process.exit(1);
  }

  // NOTE: 检验当前版本号是否合法
  if (!semver.valid(version)) {
    console.error(magenta("The current version number is invalid!"));
    process.exit(1);
  }

  console.log(green(`\nCurrent version: ${cyan(`${version}`)}`));

  const { isRelease } = await inquirer.prompt([
    {
      type: "confirm",
      name: "isRelease",
      message: "是否发布正式版？",
    },
  ]);

  const releaseChoices = [
    "[major]主版本(不兼容的重大更新)",
    "[minor]次版本(兼容的新增功能)",
    "[patch]修订号(兼容的问题修正)",
  ];

  let newVersion = "";
  const currentPreVersionTmp = version.match(/-([a-z]+)\./);

  if (isRelease) {
    const secondAnswer = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "选择版本号?",
      choices: releaseChoices,
    });
    const releaseVersionType = secondAnswer.type.match(/\[(\w+)\]/)[1];
    if (currentPreVersionTmp) {
      const versionTmp = semver.inc(version, `pre${releaseVersionType}`);
      newVersion = semver.inc(versionTmp, releaseVersionType);
    } else {
      newVersion = semver.inc(version, releaseVersionType);
    }
  } else {
    const preReleaseType = [
      "[alpha]内部测试版",
      "[experimental]实验功能",
      "[beta]公开测试版：新功能迭代或修复 bug",
      "[rc]发行候选版本：无新功能迭代，仅修复 bug",
    ];

    if (currentPreVersionTmp) {
      preReleaseType.unshift("[number]仅更新先行版本数字(beta.0 -> beta.1)");
    }
    const thirdAnswer = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "选择先行版本号?",
      choices: preReleaseType,
    });
    const preReleaseVersionType = thirdAnswer.type.match(/\[(\w+)\]/)[1];

    newVersion = semver.inc(
      version,
      "prerelease",
      preReleaseVersionType === "number"
        ? currentPreVersionTmp[1]
        : preReleaseVersionType
    );
  }

  const { isSure } = await inquirer.prompt([
    {
      type: "confirm",
      name: "isSure",
      message: `确认更新版本: ${version} => ${newVersion} `,
    },
  ]);

  if (!isSure) {
    process.exit(0);
  }

  const metadata = {
    version: newVersion,
    tag: `v${newVersion}`,
    prefix: `chore: `,
  };
  // 获取当前 git 仓库的 upstream 分支
  const gitHeadFile = path.resolve(process.cwd(), ".git/HEAD");
  let upstreamBranch = "master";

  try {
    const headContent = fs.readFileSync(gitHeadFile, "utf8").trim();
    if (headContent.startsWith("ref:")) {
      const branchPath = headContent.split(" ")[1];
      upstreamBranch = branchPath.split("/").slice(2).join("/");
    } else {
      console.error(magenta("Failed to read the current git branch."));
      upstreamBranch = "";
    }
  } catch (err) {
    console.error(magenta("Failed to read the current git branch."));
    upstreamBranch = "";
  }

  console.log(green(`\nCurrent upstream branch: ${cyan(upstreamBranch)}`));
  const remote = ["origin", upstreamBranch];

  try {
    await overwritePackageJson(
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
    await execShell(metadata, remote[0], remote[1]);
    console.log("Push", remote.join("/"));
    console.log(`\n${green("[ renew-it ]")} ${cyan("Update Success!")}\n`);
  } catch (err) {
    console.error(err);
  }
}

if (args["help"] || args["h"]) {
  console.log("\n  Tip:\n");
  console.log(
    "    You should run this script in the root directory of you project or run by npm scripts."
  );
  console.log("\n  Examples:\n");
  console.log(`    ${green("$")} renew-it`);
  console.log("");
} else {
  exec();
}
