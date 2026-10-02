const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");

async function pullRepo() {
  const repoName = path.basename(process.cwd());
  const repoPath = path.resolve(process.cwd(), ".apnaGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    await fs.mkdir(commitsPath, { recursive: true });

    const data = await s3
      .listObjectsV2({ Bucket: S3_BUCKET, Prefix: '${repoName}/commits/' })
      .promise();

    const objects = (data.Contents || []).filter((o) => !o.Key.endsWith("/"));

    for (const object of objects) {
      const key = object.Key;
      const relativeKey = key.slice(`${repoName}/`.length); // "commits/<id>/file.txt"
      const commitDir = path.join(commitsPath, path.dirname(relativeKey).split("/").pop());

      await fs.mkdir(commitDir, { recursive: true });

      const fileContent = await s3
        .getObject({ Bucket: S3_BUCKET, Key: key })
        .promise();
      await fs.writeFile(path.join(repoPath, relativeKey), fileContent.Body);
    }

    console.log("All commits pulled from S3.");
  } catch (err) {
    console.error("Unable to pull : ", err);
  }
}

module.exports = { pullRepo };
