import { runATFW } from ".";

type Nil = undefined | null;
const isNil = <T>(obj: unknown): obj is Nil => obj === null || obj === undefined;
const isEmptyStringOrNil = (str: string) => isNil(str) || str === "";

const [, , inputFile, outputFile] = process.argv;

if (isEmptyStringOrNil(inputFile)) throw `The argument 'inputFile' cannot be empty string or nil!`;
if (isEmptyStringOrNil(outputFile)) throw `The argument 'outputFile' cannot be empty string or nil!`;

runATFW(inputFile, outputFile, "jest");
