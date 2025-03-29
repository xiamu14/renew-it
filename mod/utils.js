const { exec, execSync } = require("child_process");
const fs = require("fs");
const inquirer = require("inquirer");
const { green, cyan } = require("chalk");

function overwritePackageJson(
  packageFile,
  packageFileData,
  version,
  newVersion
) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      packageFile,
      packageFileData.replace(version, newVersion),
      "utf8",
      (err) => {
        if (err) reject(err);
        resolve(green("\nUpdate package.json success!"));
      }
    );
  });
}

async function gitExecShell(metadata) {
  // 获取当前代码git仓库的 upstream 和 branch
  const upstreams = execSync("git remote")
    .toString()
    .replaceAll(" ", "")
    .split("\n")
    .filter((item) => item);
  const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

  let upstream = upstreams.length === 1 ? upstreams[0] : "";
  if (upstreams.length > 1) {
    const answer = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "选择远程仓库?",
      choices: upstreams,
    });
    upstream = answer.type;
  }

  let shellList = "";
  if (upstream) {
    shellList = [
      `echo "\n${green("[ 1 / 2 ]")} ${cyan(
        `Commit and push to ${upstream}/${branch}`
      )}\n"`,
      "git add .",
      `git commit -m "${metadata.prefix}${metadata.version}"`,
      `git push ${upstream} ${branch}`,
      `echo "\n${green("[ 2 / 2 ]")} ${cyan(
        `Tag and push tag to ${upstream}`
      )}\n"`,
      `git tag ${metadata.tag}`,
      `git push ${upstream} ${metadata.tag}`,
    ].join(" && ");
  } else {
    shellList = [
      `echo "\n${green("[ 1 / 2 ]")} ${cyan(`Commit and Tag`)}\n"`,
      "git add .",
      `git commit -m "${metadata.prefix}${metadata.version}"`,
      `git tag ${metadata.tag}`,
    ].join(" && ");
  }

  return new Promise((resolve) => {
    const childExec = exec(
      shellList,
      { maxBuffer: 10000 * 10240 },
      (err, stdout) => {
        if (err) {
          throw err;
        } else {
          resolve([upstream, branch]);
        }
      }
    );
    childExec.stdout.pipe(process.stdout);
    childExec.stderr.pipe(process.stderr);
  });
}

module.exports = {
  overwritePackageJson,
  gitExecShell,
};
