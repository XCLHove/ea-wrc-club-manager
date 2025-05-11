const { join } = require('path')
const fs = require('fs')
const child_process = require('child_process')

const PROJECT_ROOT = getProjectRoot()
const packageJson = readPackageJson()
const version = packageJson.version
const now = new Date()
child_process.execSync('npm run vite-build', {
  stdio: 'inherit',
  cwd: PROJECT_ROOT,
  env: {
    ...process.env,
  },
})
generateLatestJsonFile()

function getProjectRoot() {
  let base = __dirname
  return join(base, '..')
}
function readPackageJson() {
  const packageJsonPath = join(PROJECT_ROOT, 'package.json')
  const text = fs.readFileSync(packageJsonPath, { encoding: 'utf8' })
  return JSON.parse(text)
}
function generateLatestJson() {
  const latestJson = {
    version: version,
    downloadUrl: [
      {
        name: 'dev',
        url: `http://localhost:28000/update/EA WRC Club Manager-Windows-${version}-Setup.exe`,
      },
      {
        name: 'zfile(xclhove)',
        url: `https://zfile.xclhove.top/directlink/onedrive_1/github/xclhove/ea-wrc-club-manager/EA WRC Club Manager-Windows-${version}/EA WRC Club Manager-Windows-${version}-Setup.exe`,
      },
      {
        name: 'github',
        url: `https://github.com/xclhove/ea-wrc-club-manager/releases/latest/download/EA.WRC.Club.Manager-Windows-${version}-Setup.exe`,
      },
    ],
    description: 'https://gitee.com/xclhove/ea-wrc-club-manager/raw/master/update-log.md',
    file: `EA WRC Club Manager-Windows-${version}-Setup.exe`,
    updateTime: now.getTime(),
  }
  return latestJson
}
function getLatestJsonPath() {
  const latestJsonPath = join(PROJECT_ROOT, 'release', version, 'latest.json')
  return latestJsonPath
}
function generateLatestJsonFile() {
  const latestJsonPath = getLatestJsonPath()
  const latestJson = generateLatestJson()
  fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2))
}
