const { fork } = require("child_process");

const TEST_NAMES = ["composite", "single", "simpleToBuffer", "simpleToFile"];

const CONCURRENCY_OPTS = [0, 1];

const CACHE_OPTS = [false, true];

const CONCURRENT_OPS = 1;

const runSingleTest = (testName, concurrentOps, concurrency, disableCache) =>
  new Promise((resolve, reject) => {
    console.log("Launching test " + [testName, concurrentOps, concurrency, disableCache].join(" ") + "\n");
    const child = fork("./run-test.js", [testName, concurrentOps, concurrency, disableCache, true], {
      stdio: ["inherit", "inherit", "inherit", "ipc"]
    });

    child.on("error", x => {
      console.log("bl");
      console.log(x);
      reject(x);
    });

    child.on("close", code => {
      if (code !== 0) {
        reject(new Error("Test " + [testName, concurrentOps, concurrency, disableCache].join("-") + " failed"));
      } else {
        console.log("Test " + [testName, concurrentOps, concurrency, disableCache].join("-") + " succeeded\n");
        resolve();
      }
    });
  });

let promise = Promise.resolve();

TEST_NAMES.forEach(testName => {
  CONCURRENCY_OPTS.forEach(concurrency => {
    CACHE_OPTS.forEach(disableCache => {
      promise = promise.then(() => runSingleTest(testName, CONCURRENT_OPS, concurrency, disableCache));
    });
  });
});

promise.then(
  () => {
    console.log("All tests completed!");
  },
  err => {
    console.log("Some tests failed...");
    console.log(err.stack);
    process.exit(1);
  }
);
