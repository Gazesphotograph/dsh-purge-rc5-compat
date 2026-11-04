# DSH 0.2.1-rc.5 适配存档

这是基于 [HunYiSage/dsh-purge](https://github.com/HunYiSage/dsh-purge)
发布版 v1.1.90 的个人代码存档，当前版本 `1.1.90+rc5.3`。
保留上游 LICENSE、NOTICE 与署名，不代表上游正式发布。

主要变更：

- 保留上游 rc.2 / rc.5 匹配规则，以 rc.5 为主要目标。
- 修复 #92 / #93 在重复 Apply 时重复插入桌面日志、事件监听器和计时器。
- 修复 Windows 桌面应用后的重启交接：由 Windows Shell 启动独立助手，移除盲目的后台定时退出，首次展开和后续重启使用相同流程。
- 增加桌面诊断幂等测试与独立重启助手测试。

在 Windows DSH 0.2.1-rc.5 上完成独立副本验证、首次真实归档切换和后续再次重启；78 项补丁 applied，0 pending / drifted / unmatched，47 个目标 JS 文件语法检查通过，3 项回归测试通过。模型回答与任意第三方插件组合未验证。

验证和打包：

```powershell
npm test
npm pack --ignore-scripts
```

仓库保存代码、上游文件和经过整理的验证说明，不包含本机安装包、个人配置、凭据、对话、崩溃日志或环境备份。
详细说明见 [docs/rc5-compatibility.md](docs/rc5-compatibility.md)。
