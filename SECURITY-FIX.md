# 安全修复报告

## 🚨 发现的安全问题

**问题**: `fs.readFileSync()` 使用动态路径，存在路径遍历攻击风险

**位置**: `src/lib/config-manager.ts:66`

```typescript
// 危险代码
const fileContent = readFileSync(this.configPath, "utf-8");
```

**风险**: 攻击者可以通过构造恶意路径读取系统中的任意文件，如 `../../../etc/passwd`

## 🔒 安全修复措施

### 1. 路径验证和规范化

```typescript
/**
 * 验证并解析配置文件路径，防止路径遍历攻击
 */
private validateAndResolvePath(configPath: string): string {
  // 只允许特定的配置文件名
  const fileName = configPath.split('/').pop() || configPath.split('\\').pop() || configPath;
  
  if (!this.allowedConfigFiles.includes(fileName)) {
    console.warn(`警告: 不允许的配置文件名 "${fileName}"，使用默认配置`);
    return resolve(process.cwd(), "mcp-servers.json");
  }

  // 解析为绝对路径并确保在项目目录内
  const projectRoot = process.cwd();
  const resolvedPath = resolve(projectRoot, configPath);
  
  // 确保解析后的路径仍在项目根目录内
  if (!resolvedPath.startsWith(projectRoot)) {
    console.warn(`警告: 配置文件路径超出项目范围 "${configPath}"，使用默认配置`);
    return resolve(projectRoot, "mcp-servers.json");
  }

  return resolvedPath;
}
```

### 2. 文件名白名单

```typescript
private readonly allowedConfigFiles = [
  "mcp-servers.json",
  "mcp-servers.example.json",
];
```

### 3. 文件大小限制

```typescript
// 限制文件大小以防止 DoS 攻击
if (fileContent.length > 1024 * 1024) { // 1MB 限制
  throw new Error("配置文件过大");
}
```

### 4. 输入验证和清理

#### 服务器配置验证
```typescript
// 验证必需字段
if (!server.name || typeof server.name !== 'string') {
  throw new Error("服务器名称是必需的并且必须是字符串");
}

if (!server.type || !['stdio', 'sse'].includes(server.type)) {
  throw new Error(`不支持的服务器类型: ${server.type}`);
}
```

#### 命令白名单
```typescript
private sanitizeCommand(command: string): string {
  const allowedCommands = ['node', 'python', 'python3', 'npx', 'npm'];
  const cleanCommand = command.trim();
  
  if (!allowedCommands.includes(cleanCommand)) {
    throw new Error(`不允许的命令: ${cleanCommand}`);
  }
  
  return cleanCommand;
}
```

#### 参数清理
```typescript
private sanitizeArgs(args: any[]): string[] {
  if (!Array.isArray(args)) {
    return [];
  }
  
  return args
    .filter(arg => typeof arg === 'string')
    .map(arg => arg.replace(/[;&|`${}()]/g, '').trim())
    .filter(arg => arg.length > 0);
}
```

#### URL 验证
```typescript
private sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`不允许的 URL 协议: ${parsed.protocol}`);
    }
    return parsed.toString();
  } catch (error) {
    throw new Error(`无效的 URL: ${url}`);
  }
}
```

### 5. 环境变量安全处理

```typescript
private processEnvironmentVariables(env: Record<string, any>): void {
  Object.keys(env).forEach(key => {
    const value = env[key];
    
    // 验证键名
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      console.warn(`警告: 跳过无效的环境变量名: ${key}`);
      return;
    }
    
    if (typeof value === "string" && value.startsWith("$")) {
      const envVar = value.slice(1);
      // 验证引用的环境变量名
      if (!/^[A-Z_][A-Z0-9_]*$/.test(envVar)) {
        console.warn(`警告: 跳过无效的环境变量引用: ${envVar}`);
        return;
      }
      process.env[key] = process.env[envVar] || value;
    } else if (typeof value === "string") {
      process.env[key] = value;
    }
  });
}
```

## 🛡️ 安全措施总结

### 防护类型

1. **路径遍历攻击防护**
   - 文件名白名单
   - 路径规范化
   - 项目目录边界检查

2. **命令注入防护**
   - 命令白名单
   - 参数清理
   - 特殊字符过滤

3. **DoS 攻击防护**
   - 文件大小限制
   - 输入验证

4. **协议安全**
   - URL 协议限制
   - 环境变量名验证

### 安全级别

- ✅ **高安全性**: 严格的输入验证和白名单
- ✅ **防御性编程**: 优雅的错误处理，不会因配置错误而崩溃
- ✅ **日志记录**: 安全事件的警告日志
- ✅ **最小权限**: 只允许必要的操作

## 🧪 测试验证

安全修复已通过以下测试：

1. ✅ 路径遍历攻击测试
2. ✅ 恶意文件名测试
3. ✅ 正常配置文件加载测试
4. ✅ 命令注入防护测试
5. ✅ URL 验证测试

## 📋 建议的后续改进

1. **代码审计**: 定期进行安全代码审计
2. **依赖扫描**: 使用工具扫描依赖包的安全漏洞
3. **输入验证**: 继续加强其他用户输入的验证
4. **安全测试**: 集成自动化安全测试

## 🔍 相关安全最佳实践

1. **永不信任用户输入**: 始终验证和清理外部输入
2. **最小权限原则**: 只提供必要的权限和功能
3. **纵深防御**: 多层安全措施
4. **安全日志**: 记录安全相关事件
5. **定期更新**: 保持依赖和系统更新

这次安全修复大大提高了应用程序的安全性，有效防止了路径遍历、命令注入等常见攻击。