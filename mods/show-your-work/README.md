# claude-show-your-work

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

不离开终端即可查看、审阅并迭代 agent 的工作。为 Claude Code 提供图片、视频与可视化 QA。

## 安装

```
/plugin marketplace add https://github.com/iamumeransari/claude-show-your-work.git#releases
/plugin install show-your-work@iamumeransari
```

支持 macOS 与 Linux 上的 Ghostty 和 kitty，需要 Claude Code 2.1.286+。视频/音频还需 ffmpeg，HTML 需 Chrome/Chromium/Playwright 浏览器，PDF 需 poppler。

## 用法

Claude 构建或修改可视内容时会在聊天中展示。也可直接要求：“给首页 hero 出四个方向并排展示”“构建注册表单、测试它并给我看录屏”。

- 前后对比录屏：旧版与新版录制相同步骤，同步并排播放
- 变更标记：每处改动带时间戳，点击跳到对应时刻
- 实时检查：每项测试在视频到达时变绿或变红
- 图片与视频：并排比较多个方案，播放器支持时间轴、版本切换与保存

## 出处与许可证

- 原作者：[iamumeransari](https://github.com/iamumeransari/claude-show-your-work)
- 原仓库：https://github.com/iamumeransari/claude-show-your-work
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
