const core = require('@actions/core')
const { exec } = require('@actions/exec')
const path = require('path')
const https = require('https')
const os = require('os')

const releasePatterns = () => {
  const platform = os.platform()
  let platformSuffix

  switch (platform) {
    case 'linux':
      platformSuffix = 'linux'
      break
    case 'darwin':
      platformSuffix = 'macos'
      break
    default:
      core.setFailed(`Unknown or unsuppored platform: ${platform}`)
      return
  }

  return {
    core: new RegExp(`dhall-[0-9.]+.*-${platformSuffix}\.tar\.bz2`, 'i'),
    json: new RegExp(`dhall-json-[0-9.]+.*-${platformSuffix}\.tar\.bz2`, 'i'),
    yaml: new RegExp(`dhall-yaml-[0-9.]+.*-${platformSuffix}\.tar\.bz2`, 'i'),
  }
}

const fetchReleases = async () => {
  const version = core.getInput('version')
  const versionPath = version == 'latest' ? 'latest' : `tags/${version}`
  const url = `https://api.github.com/repos/dhall-lang/dhall-haskell/releases/${versionPath}`

  core.info(`Fetching dhall releases from ${url}`)

  let release

  try {
    release = JSON.parse(await get(url))
  } catch (error) {
    core.setFailed(
      `Failed to fetch releases from GitHub API, providing a token may help.\nError: ${error}`
    )
    return
  }

  const patterns = releasePatterns()

  const coreRelease = release.assets.find(asset =>
    patterns.core.test(asset.name)
  )
  const jsonRelease = release.assets.find(asset =>
    patterns.json.test(asset.name)
  )
  const yamlRelease = release.assets.find(asset =>
    patterns.yaml.test(asset.name)
  )

  return {
    core: coreRelease.browser_download_url,
    json: jsonRelease.browser_download_url,
    yaml: yamlRelease.browser_download_url,
  }
}

const get = url => {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'setup-dhall Github action',
    }

    const token = core.getInput('github_token')

    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    const request = https.get(url, { headers })

    request.on('response', res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode == 200) {
          resolve(data)
        } else {
          reject(data)
        }
      })
    })

    request.on('error', err => {
      reject(err)
    })
  })
}

const run = async () => {
  const urls = await fetchReleases()

  await exec(path.join(__dirname, 'install-dhall.sh'), [urls.core, urls.json, urls.yaml])
}

try {
  run()
} catch (error) {
  core.setFailed(`Action failed with error: ${error}`)
}
