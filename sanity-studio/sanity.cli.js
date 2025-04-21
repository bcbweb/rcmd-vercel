/**
 * This configuration file lets you run `$ sanity [command]` in this folder
 * Go to https://www.sanity.io/docs/cli to learn more.
 **/

const { defineCliConfig } = require("sanity/cli");

module.exports = defineCliConfig({
  api: {
    projectId: "ce6vefd3",
    dataset: "production",
  },
  studioHost: "rcmd",
});
