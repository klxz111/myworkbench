import path from 'path';

const WORKSPACE_ROOT = path.join(process.cwd(), '..', 'workspace');

export function getWorkspaceRoot(): string {
  return process.env.MYWORKBENCH_WORKSPACE || WORKSPACE_ROOT;
}

/**
 * 把工作区相对路径解析为绝对路径，越界（../ 或兄弟目录前缀，如 workspace-evil）时抛错。
 * 不能用 startsWith(root)：不带分隔符的前缀比较会放行 <root>xxx 这类兄弟目录。
 */
export function safeJoin(root: string, rel: string): string {
  const resolved = path.resolve(root, rel);
  const relative = path.relative(root, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('路径超出工作区范围');
  }
  return resolved;
}
