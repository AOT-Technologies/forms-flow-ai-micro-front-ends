// Import required AWS SDK clients and commands for Node.js.
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./libs/s3Client.js";
import { createReadStream, createWriteStream } from "fs";
import { createGzip } from "zlib";

const BUCKET = process.env.BUCKET;
const VERSION = process.env.VERSION;
const component = process.argv.slice(2)[0];

if (!component) {
  throw Error(`Please provide component name 
  usage node index [component]
                            ^^^
  `);
}

import Walk from "@root/walk";
import path from "path";

const compressFileAndUpload = (fileName, filePath) => {
  const stream = createReadStream(`${filePath}/${fileName}`);
  stream
    .pipe(createGzip())
    .pipe(createWriteStream(`${filePath}/${component}.gz.js`))
    .on("finish", () => {
      console.log(`Successfully compressed the file at ${filePath}`);
      upload(`${component}.gz.js`, `${filePath}/${component}.gz.js`);
    });
};

const run = async (params) => {
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    const results = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully created " +
        params.Key +
        " and uploaded it to " +
        params.Bucket +
        "/" +
        params.Key
    );
    return results; // For unit tests.
  } catch (err) {
    console.log("Error", err);
    throw Error("Upload failed!");
  }
};

/**
 *
 * @param {string} file_name - artifact name
 * @param {string} file - artifact path
 */
async function upload(file_name, file) {
  const isCss = file_name.includes(".css")
  const params = {
    Bucket: BUCKET,
    Key: `${component}@${VERSION}/${file_name}`,
    Body: createReadStream(file),
    ContentType: isCss ? "text/css; charset=utf-8" : "application/javascript",
    ContentEncoding: isCss ? undefined : "gzip",
  };
  run(params);
}

Walk.walk(`../${component}/dist`, walkFunc)
  .then(function () {
    console.log("Collected all artifacts to upload");
  })
  .catch(function (reason) {
    console.log("Failed to collect the artifacts", reason);
  });

// walkFunc must be async, or return a Promise
function walkFunc(err, pathname, dirent) {
  if (err) {
    // throw an error to stop walking
    // (or return to ignore and keep going)
    console.warn("fs stat error for %s: %s", pathname, err.message);
    return Promise.resolve();
  }

  // return false to skip a directory
  // (ex: skipping "dot file" directories)
  if (dirent.isDirectory() && dirent.name.startsWith(".")) {
    return Promise.resolve(false);
  }

  if (dirent.isFile()) {
    try {
      const filePath = path.dirname(pathname);
      const fileName = dirent.name;
      console.log(`Collecting artifact -> ${filePath}/${fileName}`);

      if (fileName === `${component}.js`) {
        compressFileAndUpload(fileName, filePath);
      }
      if (fileName === `${component}.min.css`) {
        upload(fileName, `${filePath}/${fileName}`);
      }
    } catch (err) {
      console.log("Upload failed", err);
      throw err;
    }
  }
  return Promise.resolve();
}
