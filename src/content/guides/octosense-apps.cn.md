# 运行应用，再追踪它的 Agent

OctoScript 描述工作流与界面。OctoSense 托管应用，并连接到 Rust Agent 内核 **octos**。本指南先把应用从源码带到运行中的 UI，再追踪一条用户请求如何经过应用 Agent。

帮助编写应用的开发 Agent，与回答应用用户的运行时 Agent，是两个角色。开发仪器检查运行中的 UI；应用 Agent 使用产品宿主授予的工具和数据。

## 先确定要运行什么

| 产物 | 运行时 | 从哪里开始 |
| --- | --- | --- |
| 工作流 `.octoscript` | OctoScript 有界工作流运行时，使用已注册工具和宿主签发的授权 | [工作流示例](why-octoscript.cn.md) |
| 原生 Rust 应用 | 编译后的 `AppModule`，包含 Rust 事件处理与 Makepad 组件 | [OctoSense 构建与启动说明](https://github.com/OctoSense-org/OctoSense/blob/main/README.md) |
| 受限容器中的 `main.splash` 应用 | 在 Splash UI 宿主内求值的 Makepad Script | Design Flow 的 `tools/octo run` 与 App Hub 的 `card-host` |
| L0 `page.card`、数据与 kit | OctoScript 检查并实例化卡片；OctoScript-Makepad 转换和渲染 | 同一个卡片宿主，同时提供声明的数据与 kit 文件 |

`tools/octo` 是 Python 开发命令，负责启动 Rust 卡片宿主；它不是 `octos` Agent 内核。原生 Rust 应用也可以嵌入 Splash 视图，同时把服务保留在编译后的 Rust 代码里。

## 本地运行一个容器应用

按 [Design Flow 原生工作区说明](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/NATIVE-WORKSPACE.md)准备仓库和构建环境。运行时锁文件选择彼此兼容的源码版本。

**命令验证状态：**下列原生构建与启动命令未在本次网站检查中执行。

在 Design Flow 仓库中执行：

```sh
python3 tools/setup-native.py
python3 tools/setup-native.py --check
```

进入同级 App Hub 仓库：

```sh
cargo build --release -p octosense-card-host -p octosense-app-hub
```

回到 Design Flow，选择尚不存在的目标目录与空闲端口：

```sh
tools/octo doctor
tools/octo new /tmp/octosense-notes --id walkthrough.notes --name "Notes"
tools/octo run /tmp/octosense-notes/bundle --hidden --detach --port 8141
tools/octo shot 8141 /tmp/octosense-notes/first-frame.png
curl -s http://127.0.0.1:8141/quit
```

`run` 的应用包路径是位置参数。使用 `--detach` 时，新进程提供 UI 和已渲染帧后命令返回；不加这个参数，终端会等到应用退出。开发运行默认会更新 manifest 的摘要，因此请使用未签名的工作副本。

这条路径检查解析、渲染，以及宿主限制下的存储和网络策略。独立 `card-host` **没有注册宿主服务，也没有 Agent 运行时**，无法完成 `mail.*`、`model.complete` 或 `octos.*` 请求。要在完整 Shell 中测试已安装应用，请按[本地签名目录演练](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/PUBLISHING.md#4-rehearse-the-store-path-locally)操作。桌面、Android Home 与 ROM 命令属于 OctoSense 仓库；ROM 构建还包含操作系统。

## 从卡片源码到原生组件

**实例化（realization）**检查卡片声明的数据与状态，并展开组件，得到完整的卡片树。**转换（lowering）**把这棵树变成组件 kit 和渲染器需要的更具体的源码。

```text
page.card + 宿主数据 + 实例状态
  → OctoScript L0 检查与实例化
  → 组件 kit 转换
  → 受检查的求值，得到渲染器 UiNode 数据
  → Makepad 组件源码
  → 原生宿主挂载 View 并处理事件
```

L0 实例化树与渲染器的 `UiNode` 是不同的数据表示。原生 kit 加载 `native/<mood>/kit.json`，走保留设计几何的路径；其他 kit 组装调色板和组件源码。两条路径都由宿主提供数据、注册组件、处理动作，并决定何时重新渲染。

在框架的目录与预览宿主中，最终组件源码在应用的主 `makepad-script` VM 上求值，得到的 `View` 赋给 `Splash.view`。App Hub 的容器脚本宿主有自己的准入与隔离环境设置。共享 VM 实现并不意味着每个应用共享实例、绑定或权限。[渲染器源码导读](https://github.com/OctoSense-org/OctoScript-Makepad/blob/fb29b6b1cb6e16f38d99a8aef60431a9565dfd59/docs/architecture-walkthrough.md)说明了具体调用和不同的求值预算。

## 追踪“总结我保存的笔记”

假设应用已把笔记存进向 Agent 开放的账户目录，用户也在 OctoSense 中允许了该 Agent。**Peer** 是应用 Agent 的身份；**session** 保存一段对话及其记录；**turn** 是一次请求以及为回答它而执行的模型和工具工作。

1. 用户在桌面打开 **Ask &lt;app&gt;** 并发送请求。Shell 选择应用 Peer 及其用户会话。应用也可以通过 Shell 的 `octos.*` 服务提供自己的聊天界面。
2. Shell 以用户身份发起 turn。Octos 检查是否允许执行、记录归属，再启动模型处理。模型可以请求工具；模型写出的文字不会自行授予权限。
3. 在 Unix 上，用户同意且账户工作区可用时，Shell 可提供有界的 `files.list`、`files.read` 和 `files.search` 工具。它们读取开放的账户目录。位于应用存储根目录的记录，以及该目录之外的宿主服务密钥，不会自动变成可读数据。
4. 工具结果回到模型，模型据此写出答案。事件与完成状态返回最初提出请求的用户会话。

应用 UI 的数据存储、对话记录与 Agent 记忆是不同的存储。其他位置的结构化记录，需要由已实现的工具读取和解释；仅随应用包提供工具声明，不能让操作自动变成可执行代码。

系统 Agent 可以使用应用 Peer 的实际标识委派同一请求。系统请求走 Peer 的系统会话；用户聊天可以使用另一条共享有限上下文的 session。两者各自保存对话记录。用户答案返回该会话的事件接收方。两种来源都可以在 **peer blackboard** 中留下标记了来源的协作结果；用户来源的结果不会自动唤醒系统 Agent。系统 Agent 汇总自己委派请求的结果。

## 调用其他应用或系统 Agent

跨应用调用需要工具所有者的可共享声明、调用方授权、宿主准入，以及实际可执行的路由。工具策略要求确认时，还需经过批准。App Hub 默认提供的工具列表不包含任意名称，例如 `mail.send`；把它加入 `agent.tools` 会被默认准入拒绝。

系统到应用的委派已经实现。容器应用不会继承系统 Agent 的工具，也不会自动得到任意应用到系统的委派能力。它只能使用宿主实际提供并授权的协作路由。

| 声明或功能 | 当前集成边界 |
| --- | --- |
| 第一方 `implemented_by: "host-service"` 工具 | 按宿主策略，通过已注册的 Rust 服务执行。 |
| 商店应用的 `implemented_by: "app"` 工具 | 当前 Shell 没有这些声明的脚本分发器；打开应用 UI 也不会安装一个。 |
| 应用包 `AGENT.md` 与 skills | App Hub 会验证，但当前 Shell 不把内容安装到应用 Peer。仓库里的 `AGENTS.md` 则用于指导开发 Agent。 |
| 模型 `needs`、后台触发器与调度元数据 | 验证声明不会补齐尚未接入的运行时选择与调度行为。 |
| L0 `sys.chat` / `ChatEntry` | Shell 的运行时支持，但当前 Design Flow 创作版本不支持。编写这类卡片前，先检查 [AI 服务与运行时兼容性](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/AI-SERVICES.md#ai-written-text-and-in-card-chat-model-copy-syschat)。 |

## Tokio 在哪里

Peer 可以在没有任务运行时继续存在。处理请求时，Octos 先创建停在**启动屏障**后的 turn 编排任务，再检查准入、记录归属并发送接受响应，最后释放屏障；拒绝请求时则中止等待中的任务。编排任务随后创建 Agent 处理任务。宿主工具调用通过单次结果通道等待；等待期间 Tokio 可以调度其他工作。实际的数据库或网络操作在哪里执行，由宿主决定。

连接传输与事件转发还会增加其他任务。卡片／VM 求值和 UI 事件遵循 UI 宿主的调度；一个 Peer 不等于一个 Tokio 任务，也不等于一个 UI VM。Shell 的应用 Peer 共享内核运行时。桌面与 Android 通常使用子进程，OpenHarmony 使用嵌入式运行时，iOS 当前没有集成内核。[octos 请求与任务导读](https://github.com/octos-org/octos/blob/82900bf149d3a53016c1c1492ffc075d2d4fb0ed/docs/octosense-integration-walkthrough.md)进一步解释准入、取消与应答匹配。

## 继续阅读源码

- [OctoSense](https://github.com/OctoSense-org/OctoSense/blob/61c668279a7c38a0f8056134d8d29e42ed715806/docs/architecture-walkthrough.md)：原生应用、桌面／Home／ROM、对话入口与 Shell broker。
- [App Hub](https://github.com/OctoSense-org/OctoSense-App-Hub/blob/19bb52d402e80e89e085dea989615e3ec612d359/docs/CODE-WALKTHROUGH.md)：准入、安装、容器存储与宿主服务请求。
- [Design Flow](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/218b25d2460d64f843932f67d419467618464fb9/docs/CODE-WALKTHROUGH.md)：CLI 行为、图像／卡片阶段与发布交接。

排查实际应用时，请阅读消费方 Cargo 和运行时锁文件选定的源码版本。本站预构建 WASM 实验室有独立的版本与构建记录，只使用本地演示状态，不连接生产 OctoSense 应用 Agent 或账户。
