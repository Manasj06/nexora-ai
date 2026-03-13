const { spawn } = require("child_process");
const electron = require("electron");
const waitOn = require("wait-on");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

waitOn({ resources: ["http://localhost:3000"] })
  .then(() => {
    const child = spawn(electron, ["."], {
      stdio: "inherit",
      env,
    });

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error("[Electron Launcher] Failed to start Electron:", error);
    process.exit(1);
  });
