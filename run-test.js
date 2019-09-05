const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Parser } = require("json2csv");
const generate = require("./generatePrintFile");

if (process.argv.length < 3) {
  throw new Error(
    "Please indicate which test you'd like to execute: single, composite, simpleToFile or simpleToBuffer"
  );
}

const testName = process.argv[2];

if (testName !== "single" && testName !== "composite" && testName !== "simpleToFile" && testName !== "simpleToBuffer") {
  throw new Error(
    "No such test available! Available tests are: single, composite, simpleToFile or simpleToBuffer. " +
      "Use 'all' to run all tests with all parameter combinations"
  );
}

const concurrentOps = process.argv.length > 3 ? parseInt(process.argv[3]) : 1;

const concurrency = process.argv.length > 4 ? parseInt(process.argv[4]) : 0;

sharp.concurrency(concurrency);

const disableCache = process.argv.length > 5 && process.argv[5] === "false";

sharp.cache(!disableCache);

const limitExecution = process.argv.length > 6 && process.argv[6] === "true";

const maxAllowedMemoryUsage = 2000;

const maxAllowedRuns = 3; //Math.round((50 * 25) / concurrentOps);

console.log(
  "Will run test '" + testName + "' with " + concurrentOps + " concurrent operation" + (concurrentOps > 1 ? "s" : "")
);

console.log("Sharp concurrency is " + concurrency + ", sharp cache is " + (disableCache ? "disabled" : "enabled"));

if (!fs.existsSync(testName)) {
  fs.mkdirSync(testName);
}

console.log("Clearing the test directory...");
const files = fs.readdirSync(testName);
for (const file of files) {
  fs.unlinkSync(path.join(testName, file), err => {
    if (err) throw err;
  });
}
console.log("Directory cleared!");

const getRSS = () => Math.round(process.memoryUsage().rss / 1000000);

let runCounter = 1;

const results = [];

const runTest = () => {
  const promises = [];
  let localCounter = 1;
  for (let i = 0; i < concurrentOps; i++) {
    promises.push(generate[testName](testName, runCounter + "-" + localCounter++));
  }
  return Promise.all(promises);
};

const run = () => {
  if (limitExecution) {
    if (getRSS() >= maxAllowedMemoryUsage) {
      console.log("Memory usage reached 2GB, terminating");
      process.exit(0);
    } else if (runCounter > maxAllowedRuns) {
      console.log(runCounter - 1 + " runs complete, terminating");
      process.exit(0);
    }
  }

  console.log("Starting run #" + runCounter);
  const startTime = Date.now();
  runTest()
    .then(() => {
      const memoryUsed = getRSS();
      const executionTime = (Date.now() - startTime) / 1000;
      console.log(
        "Run #" +
          runCounter +
          " is complete. Execution time: " +
          executionTime +
          "s. Current memory usage: " +
          memoryUsed +
          "MB"
      );
      results.push({
        runId: runCounter,
        executionTime,
        rss: memoryUsed
      });
      runCounter++;
      setTimeout(run, 100);
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });
};

const recordStats = () => {
  if (!fs.existsSync("results")) {
    fs.mkdirSync("results");
  }

  const parser = new Parser({
    fields: ["runId", "executionTime", "rss"]
  });
  const csv = parser.parse(results);
  fs.writeFileSync("results/" + [testName, concurrentOps, concurrency, disableCache].join("-"), csv);
  process.exit();
};

if (limitExecution) {
  process.on("exit", recordStats);
} else {
  process.on("SIGINT", recordStats);
}

console.log("Initial memory usage: " + getRSS() + "MB");

console.log("Will start running the test in 1 second...");

setTimeout(run, 1000);
