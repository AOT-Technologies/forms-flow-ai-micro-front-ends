// jsdom does not implement TextEncoder/TextDecoder; react-router v7 needs them
// at import time, so expose Node's implementations as globals.
import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });
