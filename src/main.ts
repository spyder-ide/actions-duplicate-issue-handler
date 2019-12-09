const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const token = core.getInput("repo-token");
    const items_string = core.getInput("items");
    const items = JSON.parse(items_string);
    const context = github.context;
    const payload = JSON.stringify(context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);

    if (!context.payload.pull_request && context.payload.action == "opened") {
      const issue_number = context.payload.issue.number;
      const body = context.payload.issue.body;

      for (let item of items) {
        const itemJ = JSON.stringify(item, undefined, 2);
        console.log(`The item payload: ${itemJ}`);
    
        if (!item.pattern || !item.reply) {
          console.log("Must provide pattern and reply!");
          return;
        }

        const pattern = new RegExp(item.pattern);

        if (body && body.match(pattern)) {
          const octokit = new github.GitHub(token);
          const new_comment = octokit.issues.createComment({
            ...context.repo,
            issue_number: issue_number,
            body: item.reply
          });

          if (!item.labels) {
            console.log("Adding labels!");
            const add_label = octokit.issues.addLabels({
              ...context.repo,
              issue_number: issue_number,
              labels: item.labels
            });
          }

          if (item.close != null && item.close) {
            console.log("Closing issue!");
            const close_issue = octokit.issues.update({
              ...context.repo,
              issue_number: issue_number,
              state: "closed"
            });
          }

          break;
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
