import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const agent = process.env.npm_config_user_agent

// word boundary + "npm/" + a digit
const npmVersionRegEx = /\bnpm\/\d/

if (!agent?.match(npmVersionRegEx)) {
  console.log('You do not appear to be using `npm` as your Node package manager. Are you using `yarn`? Try the same command with `npm`.')
  process.exit(1)
}

(async () => {

  const rl = readline.createInterface({ input, output })

  const answer = await rl.question('Are you running "npm publish" or did you pack using "npm"? That\'s "npm" instead of "yarn". Very important!!! [Yy]')
  rl.close()

  if (answer?.toLowerCase() !== 'y') {
    console.log('You must use `npm` (and not `yarn`) for this command.')
    process.exit()
  }
})()
