import {spawn, ChildProcess} from 'child_process'
import kill from 'tree-kill'
import {v4 as uuidv4} from 'uuid'
import * as core from '@actions/core'
import {setCheckRunOutput} from './output'
import * as os from 'os'
import chalk from 'chalk'
//import * as fs from 'fs'
//import * as yaml from 'js-yaml'
//import * as json from 'json'

import executeJavaScriptFile from './puppy'

const color = new chalk.Instance({level: 1})

//TODO: contains, not?
export type TestComparison = 'exact' | 'included' | 'regex'

export interface Test {
  readonly name: string
  readonly dependsOnAll?: boolean
  readonly setup: string
  /* javascript
   * json
   * yaml
   * html
   * xml 
   */
  type?: string
  shell?: string // sh by default
  shellArgs?: string
  run?: string
  readonly javascript?: string
  file?: string
  readonly feedback?: string
  readonly keywords?: string[]
  readonly urls?: string[]
  readonly input?: string
  readonly output?: string
  readonly timeout: number
  readonly points?: number
  readonly comparison: TestComparison
}

// TODO needs to be used below
enum HelpMode {
 zero= 'zero',
 pipeline= 'pipeline',
 keywords= 'keywords-only',
 full= 'full'
}

function validateJson(input: any): Json | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  // Validate 'helpMode'
  if (input.helpMode && !(input.helpMode in HelpMode)) {
    log(`unsupported helpmode: ${input.helpMode}`);
  }

  // Validate 'helpMode'
  if (input.shell && !(input.shellArgs)) {
    log(`no shell args set for custom shell ${input.shell}`);
  }



  // further validation here

  return input as Json;
}


export interface Json {
readonly helpMode?: HelpMode
maxTestIndex?: number
incrementalPassRequired?: boolean
tests: Test[]
}


export class TestError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, TestError)
  }
}

export class TestTimeoutError extends TestError {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, TestTimeoutError)
  }
}

export class TestOutputError extends TestError {
  expected: string
  actual: string

  constructor(message: string, expected: string, actual: string) {
    super(`${message}\nExpected:\n${expected}\nActual:\n${actual}`)
    this.expected = expected
    this.actual = actual

    Error.captureStackTrace(this, TestOutputError)
  }
}

const log = (text: string): void => {
  process.stdout.write(text + os.EOL)
}

const normalizeLineEndings = (text: string): string => {
  return text.replace(/\r\n/gi, '\n').trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const indent = (text: any): string => {
  let str = '' + new String(text)
  str = str.replace(/\r\n/gim, '\n').replace(/\n/gim, '\n  ')
  return str
}

const waitForExit = async (child: ChildProcess, timeout: number): Promise<void> => {
  // eslint-disable-next-line no-undef
  return new Promise((resolve, reject) => {
    let timedOut = false

    const exitTimeout = setTimeout(() => {
      timedOut = true
      reject(new TestTimeoutError(`Setup timed out in ${timeout} milliseconds`))
      if (typeof child.pid === 'number') kill(child.pid)
    }, timeout)

    child.once('exit', (code: number, signal: string) => {
      if (timedOut) return
      clearTimeout(exitTimeout)

      if (code === 0) {
        resolve(undefined)
      } else {
        reject(new TestError(`Error: Exit with code: ${code} and signal: ${signal}`))
      }
    })

    child.once('error', (error: Error) => {
      if (timedOut) return
      clearTimeout(exitTimeout)

      reject(error)
    })
  })
}

const runSetup = async (test: Test, cwd: string, timeout: number): Promise<void> => {
  if (!test.setup || test.setup === '') {
    return
  }

  const setup = spawn(test.setup, {
    cwd,
    shell: true,
    env: {
      PATH: process.env['PATH'],
      FORCE_COLOR: 'true',
      DOTNET_CLI_HOME: '/tmp',
      DOTNET_NOLOGO: 'true',
      HOME: process.env['HOME'],
    },
  })

  // Start with a single new line
  process.stdout.write(indent('\n'))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup.stdout.on('data', (chunk) => {
    process.stdout.write(indent(chunk))
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup.stderr.on('data', (chunk) => {
    process.stderr.write(indent(chunk))
  })

  await waitForExit(setup, timeout)
}

const runCommand = async (test: Test, cwd: string, timeout: number): Promise<void> => {
  let programm: string
  let output:string = ''

  if(!test.file && test.type) 
        throw new Error(`Missing required parameter: file for test type:${test.type}`)

  if(!test.type)
	  test.type = "default"

  //log(`type: {$test.type}`);

  let type = test.type || ""  
  // TODO: hier ne Schleife rein, damit run ein Array sein  kann
  switch( type.toUpperCase() ) {
  	 case 'JSON':
		 //TODO: implement
		  break;
	  case 'YAML':
		  // add: validator + query language (yq) ?
		  // https://github.com/mikefarah/yq
		  //const yamlConfig = yaml.load(fs.readFileSync(test.file, 'utf8')) as Record<string, any>;
	  	  //log(yamlConfig.name);
		  //test.run = "yq " + test.run+ " "+test.file;
		  break;
	  case 'CFN': // CloudFormation
		  test.run="cfn-lint "+ test.run+ " "+test.file; //TODO: verbose mode
	  	  //log("CloudFormation Mode");
		  break;
	  case 'JMESPATH':
		  test.run="jp -u -f "+test.file+" "+ test.run;
	  	  //log("JMESPath");
		  break;
	  case 'JAVASCRIPT': //FIXME: rename, dazu müssen wir alle bestehenden Tests anpassen :-/
		  break;
	  case 'PYTHONAST': // pip3 install pyastgrep
		  test.run="pyastgrep \""+test.run+"\" " + test.file
		  break;
	  case 'DEFAULT':
		  break;


	  default:
		  log(`Unsupported test type: {$test.type}`);
	  break;
  }

  if (test.javascript) {
  if (!test.file)
	test.file = "index.html";

  output = await executeJavaScriptFile(test.file, test.javascript);
  output = output.toString();
  } 
  else {
	  if (!test.shell)
	  	programm = test.run || ""
	  else
		programm = test.shell + " " + test.shellArgs + " '" + test.run+ "'"

  const child = spawn(programm, {
    cwd,
    shell:true,
    env: {
      PATH: process.env['PATH'],
      FORCE_COLOR: 'true',
      DOTNET_CLI_HOME: '/tmp',
      DOTNET_NOLOGO: 'true',
      HOME: process.env['HOME'],
    },
  })



  // Start with a single new line
  process.stdout.write(indent('\n'))

  child.stdout.on('data', (chunk) => {
    process.stdout.write(indent(chunk))
    output += chunk
  })

  child.stderr.on('data', (chunk) => {
    process.stderr.write(indent(chunk))
  })

  // Preload the inputs
  if (test.input && test.input !== '') {
    child.stdin.write(test.input)
    child.stdin.end()
  }

  await waitForExit(child, timeout)
  } 

  // Eventually work off the the test type
  if ((!test.output || test.output == '') && (!test.input || test.input == '')) {
    return
  }

  const expected = normalizeLineEndings(test.output || '')
  const actual = normalizeLineEndings(output)
  
  switch (test.comparison) {
    case 'exact':
      if (actual != expected) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, expected, actual)
      }
      break
    case 'regex':
      // Note: do not use expected here
      if (!actual.match(new RegExp(test.output || ''))) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, test.output || '', actual)
      }
      break
    default:
      // The default comparison mode is 'included'
      if (!actual.includes(expected)) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, expected, actual)
      }
      break
  }
}

export const run = async (test: Test, cwd: string): Promise<void> => {
  // Timeouts are in minutes, but need to be in ms
  let timeout = (test.timeout || 1) * 60 * 1000 || 30000
  const start = process.hrtime()
  await runSetup(test, cwd, timeout)
  const elapsed = process.hrtime(start)
  // Subtract the elapsed seconds (0) and nanoseconds (1) to find the remaining timeout
  timeout -= Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000)
  await runCommand(test, cwd, timeout)
}

export const runAll = async (json: Json, cwd: string): Promise<void> => {
  validateJson(json)
  let tests = json.tests as Array<Test>
  let points = 0
  let availablePoints = 0
  let hasPoints = false
  let limit = tests.length

  let outputResults: { [key: string]: string } = {};
  if(json.maxTestIndex) {
	  log(`max Test Index: ${json.maxTestIndex}`)
	  limit = json.maxTestIndex
  }

  // https://help.github.com/en/actions/reference/development-tools-for-github-actions#stop-and-start-log-commands-stop-commands
  const token = uuidv4()
  log('')
  log(`::stop-commands::${token}`)
  log('')

  let failed = false
  let testCounter=1

  //pre-compute available points, in case we're failing early
  //set all badges to failed
  let myCounter=1
  for (const test of tests.slice(0,limit) ) {
      if (test.points) {
        hasPoints = true
        availablePoints += test.points
      }
      // CHECK ME: pre-fail all tests to ensure that these failed if one failure occurs ?
      outputResults[myCounter.toString()] = "FAILING"
      myCounter ++
  }
 
  for (const test of tests.slice(0,limit) ) {
	
    try {
      /*
      if (test.points) {
        hasPoints = true
        availablePoints += test.points
      }
     */

      log(color.cyan(`📝 ${test.name}`))
      log('')
      await run(test, cwd)
      log('')
      log(color.green(`✅ ${test.name}`))
      log(``)
      if (test.points) {
        points += test.points
      }
      if (test.dependsOnAll && failed) {
        throw new TestError(`For this test to complete, you need to complete all previous steps without errors.`)
      }
      outputResults[testCounter.toString()] = "SUCCESS"
    } catch (error) {
      failed = true
      outputResults[testCounter.toString()] = "FAILING"
      log('')
      log(color.red(`❌ ${test.name}`))
      if (test.feedback) {
	      log(color.red(`❌ Tip: ${test.feedback}`))
	      if (test.urls) {
      		      log(color.red(`Resources:`))
		      test.urls.forEach((element) => {
			        log(color.red(`${element}`))
		      });
	      }
	      if (test.keywords) {
    		log(color.red(`LMGTFY:`))
		      let lmgtfy_url  = "https://googlethatforyou.com?q="
		      test.keywords.forEach((element) => {
			      lmgtfy_url+=encodeURIComponent(element+" ");
		      });
		      log(color.red(`Hint: ${lmgtfy_url}`))
	      }
      }
      if (error instanceof Error) {
        core.setFailed(error.message)
      } else {
        core.setFailed(`Failed to run test '${test.name}'`)
      }
    }
    log('') //${test.name} incrementing counter, now: ${testCounter}`)
    testCounter++
    if(json.incrementalPassRequired && failed)
	    break;
  }
  // Restart command processing
  log('')
  log(`::${token}::`)

  if (failed) {
    // We need a good failure experience
  } else {
    log('')
    log(color.green('All tests passed'))
    log('')
    log('✨🌟💖💎🦄💎💖🌟✨🌟💖💎🦄💎💖🌟✨')
    log('')
  }

  // Set the number of points
  if (hasPoints) {
    const text = `Points ${points}/${availablePoints}`
    log(color.bold.bgCyan.black(text))
    core.setOutput('Points', `${points}/${availablePoints}`)

    const percentage = Math.floor(points * 100 / availablePoints);
    core.setOutput('percentage', `${percentage} %`)

    await setCheckRunOutput(text)
  }
  //log( JSON.stringify(outputResults) )
  core.setOutput('jsonresults', JSON.stringify(outputResults))
  process.exit();
}
