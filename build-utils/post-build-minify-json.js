const { globSync } = require("glob");
const { readFileSync, writeFileSync } = require("fs");

if (process.argv.length < 3) {
    throw new Error(`Json Glob pattern is missing!`);
}

const globPattern = process.argv[2];
const jsonFiles = globSync(globPattern);

function minifyJson(filepath) {
    const jsonStr = readFileSync(filepath);
    writeFileSync(filepath, JSON.stringify(JSON.parse(jsonStr)), {
        encoding: "utf8",
    });
}

jsonFiles.forEach((filepath) => minifyJson(filepath));
