const { spawn } = require("child_process");
const readline = require("readline");
const os = require("os");
const path = require("path");

const cwd = process.cwd(); // current folder

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || cwd,
      shell: true,
      stdio: "inherit", // pipe output to current terminal
    });

    child.on("close", code => resolve(code));
    child.on("error", err => reject(err));
  });
}

function runInNewTerminal(command) {
  const platform = os.platform();
  if (platform === "win32") {
    spawn("cmd.exe", ["/c", "start", "cmd", "/k", command], { shell: true });
  } else if (platform === "darwin") {
    // macOS Terminal
    spawn("osascript", [
      "-e",
      `tell application "Terminal" to do script "cd '${cwd}'; ${command}"`,
    ]);
  } else {
    // Linux (gnome-terminal)
    spawn("gnome-terminal", ["--", "bash", "-c", `${command}; exec bash`]);
  }
}

async function runDocker() {
  console.log(">> Running Docker...");
  runInNewTerminal("docker-compose up --build");
}

async function runPython() {
  console.log(">> Running Python script...");
  const venvActivate = os.platform() === "win32" ? "venv\\Scripts\\activate.bat" : "source venv/bin/activate";
  runInNewTerminal(`${venvActivate} && cd serial && python serial_message_router.py`);
}

async function runElectron() {
  console.log(">> Running Electron...");
  runInNewTerminal("npm start");
}

async function setupPython() {
  console.log(">> Setting up Python venv...");
  await runCommand("python", ["-m", "venv", "venv"]);
  const venvActivate = os.platform() === "win32" ? "venv\\Scripts\\activate.bat" : "source venv/bin/activate";
  await runCommand(`${venvActivate} && pip install -r serial/requirements.txt`);
}

async function findPort() {
  console.log(">> Finding USB port...");
  const venvActivate = os.platform() === "win32" ? "venv\\Scripts\\activate.bat" : "source venv/bin/activate";
  await runCommand(`${venvActivate} && python serial/utils/port_finder.py`);
}

async function mainMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("GCS Startup Menu");
  console.log("1) Run Docker");
  console.log("2) Run Python script");
  console.log("3) Run Electron app");
  console.log("4) Setup Python venv");
  console.log("5) Find USB port");
  console.log("6) Run ALL");
  console.log("q) Quit");

  rl.question("Choice: ", async (answer) => {
    rl.close();
    switch (answer) {
      case "1":
        await runDocker();
        break;
      case "2":
        await runPython();
        break;
      case "3":
        await runElectron();
        break;
      case "4":
        await setupPython();
        break;
      case "5":
        await findPort();
        break;
      case "6":
        runDocker();
        runPython();
        runElectron();
        break;
      case "q":
      case "Q":
        process.exit(0);
      default:
        console.log("Invalid choice");
    }
  });
}

mainMenu();
