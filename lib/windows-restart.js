import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const psLiteral = value => "'" + String(value).replaceAll("'", "''") + "'";

/** Run the restart helper outside the Electron/Host process tree. */
export function windowsRestartLaunchPlan({ script, waitPid, asar, exe, home = "", systemRoot = process.env.SystemRoot || "C:\\Windows" }) {
  for (const file of [script, asar, exe]) {
    if (!path.win32.isAbsolute(file)) throw new Error("Restart paths must be absolute");
  }
  if (!Number.isSafeInteger(Number(waitPid)) || Number(waitPid) <= 0) throw new Error("Invalid restart wait PID");
  const powershell = path.win32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const body = "$ErrorActionPreference = 'Stop'; "
    + (home ? "$env:DSH_HOME = " + psLiteral(home) + "; " : "")
    + "& " + psLiteral(script) + " -WaitPid " + Number(waitPid)
    + " -AsarPath " + psLiteral(asar) + " -ExePath " + psLiteral(exe);
  const encoded = Buffer.from(body, "utf16le").toString("base64");
  const commandLine = '"' + powershell + '" -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand ' + encoded;
  const relay = "$ErrorActionPreference = 'Stop'; "
    + "$shell = New-Object -ComObject Shell.Application; "
    + "$shell.ShellExecute(" + psLiteral(powershell) + ", "
    + psLiteral('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -EncodedCommand '+encoded)
    + ", '', 'open', 0); 'scheduled'";
  return { powershell, body, commandLine, relay, args: ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(relay, "utf16le").toString("base64")] };
}

export function launchWindowsRestartHelper(input) {
  if (!fs.existsSync(input.script)) throw new Error("Restart helper script is missing");
  const plan = windowsRestartLaunchPlan(input);
  const output = execFileSync(plan.powershell, plan.args, {
    encoding: "utf8", windowsHide: true, timeout: 15000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (String(output).trim() !== 'scheduled') throw new Error("Restart helper launch was not acknowledged");
  return { scheduled: true, engine: "windows-shell-relay" };
}
