// generateLog.mjs
import fs from "fs";
import { Octokit } from "@octokit/rest";
import prs from "./prs.json" assert { type: "json" };

const octokit = new Octokit({ auth: process.env.PERSONAL_TOKEN });

async function fetchPRInfo(url) {
  const [, , , owner, repo, , number] = url.split("/");
  const { data } = await octokit.pulls.get({ owner, repo, pull_number: number });

  let status = "⏳ Open";
  if (data.merged_at) status = "✅ Merged";
  else if (data.draft) status = "🚧 Draft";

  return {
    title: data.title,
    url,
    repo: `${owner}/${repo}`,
    number,
    status,
    created: new Date(data.created_at).toLocaleDateString("en-US"),
  };
}

async function main() {
  const allPRs = await Promise.all(prs.map(fetchPRInfo));
  const byMonth = {};

  for (const pr of allPRs) {
    const [month, day, year] = pr.created.split("/");
    const key = `${month}/${year}`;
    byMonth[key] = byMonth[key] || [];
    byMonth[key].push(pr);
  }

  let output = `# 🧑‍💻 Open Source Work Log\n\n_Automatically generated from prs.json_\n\n`;

  for (const [month, items] of Object.entries(byMonth)) {
    output += `## 📅 ${month}\n\n`;
    for (const pr of items) {
      output += `### 🟢 ${pr.repo}\n`;
      output += `- **PR:** [${pr.title}](${pr.url})\n`;
      output += `- **Status:** ${pr.status}\n`;
      output += `- **Date:** ${pr.created}\n\n`;
    }
  }

  fs.writeFileSync("OSS_WORKLOG.md", output);
}

main().catch(console.error);
