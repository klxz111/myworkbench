import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * 快速启动：从工作台一键拉起本机开发环境（WSL 终端 / VSCode Remote-WSL 等）。
 * 命令配置存 .myworkbench/launcher.json（本机配置，不进 Markdown 库）；
 * 首次访问自动探测 WSL 发行版/家目录与 code CLI 生成默认配置，之后以文件为准（可手工编辑）。
 * 仅限本机 localhost 使用：命令来源是本机配置文件，不接受 URL 参数注入。
 */

export interface LauncherButton {
  id: string;
  label: string;
  command: string;
  args: string[];
}

interface LauncherConfig {
  buttons: LauncherButton[];
}

export function launcherConfigPath(): string {
  return path.join(process.env.MYWORKBENCH_DIR || process.cwd(), '.myworkbench', 'launcher.json');
}

function execCapture(command: string, args: string[], timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { shell: true });
      let out = '';
      const timer = setTimeout(() => child.kill(), timeoutMs);
      child.stdout?.on('data', (d: Buffer) => {
        out += d.toString();
      });
      child.on('error', () => clearTimeout(timer));
      child.on('close', () => {
        clearTimeout(timer);
        resolve(out);
      });
    } catch {
      resolve('');
    }
  });
}

async function detectEnvironment(): Promise<{ distro: string; home: string }> {
  // wsl.exe 输出是 UTF-16LE，含大量 \0，统一剥掉
  let distro = 'Ubuntu';
  const distroOut = (await execCapture('wsl.exe', ['-l', '-q'])).replace(/\0/g, '');
  const lines = distroOut
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/docker-desktop/i.test(s));
  if (lines.length > 0) distro = lines[0];

  let home = '';
  const homeOut = (await execCapture('wsl.exe', ['-d', distro, 'sh', '-c', 'echo $HOME'])).replace(/\0/g, '').trim();
  const firstLine = homeOut.split(/\r?\n/)[0]?.trim() || '';
  if (firstLine.startsWith('/')) home = firstLine;
  if (!home) home = '/root';

  return { distro, home };
}

function defaultButtons(env: { distro: string; home: string }): LauncherButton[] {
  return [
    {
      id: 'wsl-terminal',
      label: `WSL 终端（${env.distro}）`,
      command: 'cmd.exe',
      args: ['/c', 'start', '', 'wsl.exe', '-d', env.distro],
    },
    {
      id: 'vscode-wsl',
      label: `VSCode · WSL（${env.distro}）`,
      command: 'code',
      args: ['--folder-uri', `vscode-remote://wsl+${env.distro}${env.home}`],
    },
    {
      id: 'vscode-win',
      label: 'VSCode · Windows',
      command: 'code',
      args: ['-n'],
    },
  ];
}

export async function getLauncher(): Promise<{ buttons: LauncherButton[]; configPath: string; created: boolean }> {
  const cfgPath = launcherConfigPath();
  if (fs.existsSync(cfgPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as LauncherConfig;
      if (Array.isArray(config.buttons)) {
        return { buttons: config.buttons, configPath: cfgPath, created: false };
      }
    } catch {
      /* 配置损坏则重新生成 */
    }
  }
  const env = await detectEnvironment();
  const config: LauncherConfig = { buttons: defaultButtons(env) };
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf-8');
  return { buttons: config.buttons, configPath: cfgPath, created: true };
}

/** 执行按钮：分离进程拉起 GUI，不阻塞不等待；返回 null 表示 id 不存在 */
export async function runLauncherButton(id: string): Promise<{ button: LauncherButton } | null> {
  const { buttons } = await getLauncher();
  const button = buttons.find((b) => b.id === id);
  if (!button) return null;
  const child = spawn(button.command, button.args, { detached: true, stdio: 'ignore', shell: true });
  child.unref();
  return { button };
}
