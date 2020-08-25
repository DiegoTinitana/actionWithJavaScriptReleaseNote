const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const exec = promisify(require('child_process').exec)
const filePath = path.join(__dirname, process.env.GITHUB_WORKSPACE)
const run = async () => {
  try {
    await bashComand('git config --local user.email "releases@ioet.com"')
    await bashComand('git config --local user.name "Release Automation"')
    const regExp = /(v+\d+)\.(\d+)\.(\d*)$/
    const branch = await bashComand('git rev-parse --abbrev-ref HEAD')
    const tags = (await bashComand('git tag')).split('\n')
    const newtag = tags.reduce((acc, tag) => regExp.test(tag) ? [...acc, tag] : acc, []).sort()
    const release = {}
    if (newtag.length > 2) {
      const tag1 = newtag.pop();
      const tag2 = newtag.pop();
      const logs = git.command(`log ${tag1}..${tag2} --merges --grep='pull request' --pretty=format:';%h; %B'`)
      const contents = getRelease(logs)
      release.name = tag1
      release.contents = contents
    } else {
      const tag1 = newtag.pop();
      const logs = (await bashComand(`git log ${tag1} --merges --grep='pull request' --pretty=format:'%h %B /*/'`)).split('/*/')
      const contents = getRelease(logs)
      release.name = tag1
      release.contents = contents
    }

    
    const file = await fs.existsSync(`${filePath}/release.json`) ? JSON.parse(await fs.readFileSync(`${filePath}/release.json`, 'utf8')) : { releases: [] };
    const data = JSON.stringify([...file.releases, release], null, 2);
    console.log('New release:', data)
    await fs.writeFileSync(`${filePath}/release.json`, data)
    await bashComand('git add release.json')

    await bashComand(`git commit -m "save release ${new Date()}"`)
    await bashComand(`git push origin ${branch}`)
    console.log(`new release in ${branch} branch`)

  } catch (error) {
    console.log(error)
  }

}


const bashComand = async (command) => {
  const { stdout, stderr } = await exec(`cd ${filePath} && ${command}`)
  return stdout
};

const getRelease = async (logs) => {
  return logs.reduce((acc, log) => {
    const messages = log.split(':')
    const ticket = log.match(/([A-Z)-5]{2,3}\-\d+:\s)/g)
    const pr = log.match(/(\s\#\d*\s)/ig)
    const releases = {
      ticket: ticket ? ticket[0] : '',
      pullRequest: pr ? pr[0] : '',
      title: messages[messages.length - 1]
    }
    return [...acc, releases]
  }, [])
}

run()



