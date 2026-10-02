export type Locale = 'en' | 'cn';
export type Mode = 'render' | 'agents';
type Words = readonly [string, string];
export const text = (words: Words, locale: Locale) => words[locale === 'cn' ? 1 : 0];
export type Step = {
  id: string;
  title: Words;
  owner: Words;
  summary: Words;
  detail: Words;
  position: { x: number; y: number };
  source: string;
};
export type Link = {
  from: string;
  to: string;
  label: Words;
  fromSide?: 'bottom' | 'left' | 'right' | 'top';
  toSide?: 'bottom' | 'left' | 'right' | 'top' | 'top-right';
  both?: boolean;
  ownership?: boolean;
};
const root = 'https://github.com/OctoSense-org/';
const sources = {
  shell: `${root}OctoSense/blob/61c668279a7c38a0f8056134d8d29e42ed715806/docs/architecture-walkthrough.md`,
  hub: `${root}OctoSense-App-Hub/blob/19bb52d402e80e89e085dea989615e3ec612d359/docs/CODE-WALKTHROUGH.md`,
  renderer: `${root}OctoScript-Makepad/blob/fb29b6b1cb6e16f38d99a8aef60431a9565dfd59/docs/architecture-walkthrough.md`,
  kernel: 'https://github.com/octos-org/octos/blob/82900bf149d3a53016c1c1492ffc075d2d4fb0ed/docs/octosense-integration-walkthrough.md',
};
export const views: Record<Mode, { title: Words; intro: Words; start: string; steps: Step[]; links: Link[] }> = {
  render: {
    title: ['App → native UI', '应用 → 原生 UI'],
    intro: ['Choose the source you have. Follow its host and rendering path to native widgets.', '先选择源码类型，再沿着宿主与渲染路径走到原生组件。'],
    start: 'splash',
    steps: [
      { id: 'rust', title: ['Rust app module', 'Rust 应用模块'], owner: ['App author', '应用作者'], summary: ['Compiled AppModule', '编译后的 AppModule'], position: { x: 0, y: 0 }, source: sources.shell,
        detail: ['A native Rust AppModule supplies compiled widgets, state and service code. It can also embed Splash. This path describes a module inside its host; a separate native executable has its own process and integration contract.', '原生 Rust AppModule 提供编译后的组件、状态与服务代码，也可嵌入 Splash。此路径描述宿主内的模块；独立原生程序另有进程与集成约定。'] },
      { id: 'splash', title: ['Splash app source', 'Splash 应用源码'], owner: ['App bundle', '应用包'], summary: ['main.splash', 'main.splash'], position: { x: 350, y: 0 }, source: sources.hub,
        detail: ['A contained script app ships main.splash. Makepad Script evaluates it with the capabilities installed by the host. This is a UI entry point, separate from the standalone OctoScript workflow CLI.', '隔离脚本应用提供 main.splash，由 Makepad Script 使用宿主安装的能力求值。这是 UI 入口，与独立 OctoScript 工作流 CLI 分开。'] },
      { id: 'l0', title: ['L0 card + data + kit', 'L0 卡片 + 数据 + kit'], owner: ['App bundle', '应用包'], summary: ['page.card', 'page.card'], position: { x: 700, y: 0 }, source: sources.renderer,
        detail: ['An L0 card declares data, state and components. Realization checks and expands these declarations without a VM. The card still needs its declared data and a compatible component kit; it does not start an agent or gain tool access by itself.', 'L0 卡片声明数据、状态与组件，实例化在不使用 VM 的情况下检查并展开这些声明。它仍需声明的数据与兼容的组件 kit；卡片不会自行启动 Agent 或获得工具访问权。'] },
      { id: 'native', title: ['Native module host', '原生模块宿主'], owner: ['Rust + Makepad', 'Rust + Makepad'], summary: ['Mount, events and state', '挂载、事件与状态'], position: { x: 0, y: 195 }, source: sources.hub,
        detail: ['The compiled host registers the AppModule, mounts its UI and delivers events to its Rust handlers. It owns state and widget lifetime. A standalone host and the full shell have different service wiring; the shell adds the request broker and agent integration.', '编译后的宿主注册 AppModule、挂载 UI，并向 Rust 处理器交付事件。宿主持有状态并管理组件生命周期。独立宿主与完整 Shell 的服务接入不同；Shell 还提供请求 broker 与 Agent 集成。'] },
      { id: 'gate', title: ['Bundle admission', '应用包准入'], owner: ['App Hub', 'App Hub'], summary: ['Manifest → granted policy', 'Manifest → 授予的策略'], position: { x: 350, y: 180 }, source: sources.hub,
        detail: ['The host checks the bundle and resolves its manifest against HostLimits before evaluation. Storage jail, network allowlist and resource budgets constrain the app. An admitted declaration still needs an executable service.', '宿主在求值前检查应用包，并用 HostLimits 解析 manifest 请求。存储隔离目录、网络允许列表与资源预算限制应用。声明获准后，仍需实际可执行的服务。'] },
      { id: 'lower', title: ['Realize, lower, translate', '实例化、转换、翻译'], owner: ['OctoScript + renderer', 'OctoScript + 渲染器'], summary: ['Card tree → UiNode → source', '卡片树 → UiNode → 源码'], position: { x: 700, y: 330 }, source: sources.renderer,
        detail: ['OctoScript checks and realizes the semantic card tree. Lowering converts this tree into kit source; checked evaluation produces the renderer UiNode; Rust emits Makepad widget source. Native kits use the measured-design path. These are distinct tree representations and host stages.', 'OctoScript 检查并实例化语义卡片树。Lowering 把这棵树转换为 kit 源码；受检查的求值得到渲染器 UiNode，再由 Rust 生成 Makepad 组件源码。原生 kit 走保留设计几何的路径；这些是不同的树表示和宿主阶段。'] },
      { id: 'contained', title: ['Contained UI host', '隔离 UI 宿主'], owner: ['Card runner + Splash', 'Card runner + Splash'], summary: ['Evaluate and mount', '求值并挂载'], position: { x: 350, y: 390 }, source: sources.hub,
        detail: ['The runner mounts script or lowered card source inside Splash and routes UI events. Standalone card-host registers no host services or agent runtime. In OctoSense, the shell supplies registered services and the app-agent bridge.', 'Runner 在 Splash 中挂载脚本或转换后的卡片源码，并路由 UI 事件。独立 card-host 没有注册宿主服务或 Agent 运行时；OctoSense Shell 提供已注册服务与应用 Agent 桥接。'] },
      { id: 'widgets', title: ['Native Makepad UI', '原生 Makepad UI'], owner: ['UI host', 'UI 宿主'], summary: ['Draw → input → update', '绘制 → 输入 → 更新'], position: { x: 0, y: 510 }, source: sources.renderer,
        detail: ['Makepad draws widgets and delivers input through the host event loop. The host updates state and decides when to render again. A visible widget is not proof that a database, device API or agent operation is connected.', 'Makepad 绘制组件，并通过宿主事件循环交付输入。宿主更新状态并决定何时重绘。看见组件不等于已接通数据库、设备 API 或 Agent 操作。'] },
    ],
    links: [
      { from: 'rust', to: 'native', label: ['compile / register', '编译／注册'] },
      { from: 'splash', to: 'gate', label: ['bundle', '应用包'] },
      { from: 'l0', to: 'gate', label: ['bundle', '应用包'], fromSide: 'bottom', toSide: 'top-right' },
      { from: 'gate', to: 'lower', label: ['card entry', '卡片入口'], fromSide: 'right' },
      { from: 'gate', to: 'contained', label: ['script entry', '脚本入口'] },
      { from: 'lower', to: 'contained', label: ['widget source', '组件源码'], fromSide: 'bottom', toSide: 'right' },
      { from: 'native', to: 'widgets', label: ['mount', '挂载'] },
      { from: 'contained', to: 'widgets', label: ['render', '渲染'], fromSide: 'bottom', toSide: 'right' },
    ],
  },
  agents: {
    title: ['Request → answer', '请求 → 答案'],
    intro: ['The shell controls access. One shared kernel runs peer conversations; app data stays behind host tools.', 'Shell 控制访问，共享内核运行 Peer 会话；应用数据由宿主工具提供。'],
    start: 'peer',
    steps: [
      { id: 'person', title: ['Person in app chat', '应用聊天中的用户'], owner: ['Human conversation', '用户会话'], summary: ['Ask <app> or app-owned chat', 'Ask <app> 或应用聊天'], position: { x: 0, y: 0 }, source: sources.shell,
        detail: ['A person can use desktop Ask <app> or a supported app-owned chat surface. Trusted shell input carries person origin; a script’s person trigger is only its assertion, not an approval bypass. Answers return to the originating conversation with separate transcript and request IDs.', '用户可使用桌面 Ask <app> 或受支持的应用聊天界面。可信 Shell 输入标记为 person 来源；脚本的 person 触发只是它自己的声明，不能绕过审批。答案返回发起请求的会话，并保留独立记录与请求 ID。'] },
      { id: 'system', title: ['System agent', '系统 Agent'], owner: ['octos · system role', 'octos · 系统角色'], summary: ['Delegate to a prepared peer', '委派给已准备的 Peer'], position: { x: 700, y: 0 }, source: sources.shell,
        detail: ['agents.ask handles preparation and readiness. peer_send_input delegates to the actual peer identifier through the shell. System requests use the peer session; peer_gather collects their results. These routes do not grant a general app-to-system delegation API.', 'agents.ask 负责准备并等待就绪；peer_send_input 使用实际 Peer 标识，经 Shell 委派请求。系统请求使用 Peer session，peer_gather 收集结果。这些路由不会提供通用的应用到系统委派 API。'] },
      { id: 'broker', title: ['Shell app broker', 'Shell 应用 broker'], owner: ['OctoSense', 'OctoSense'], summary: ['Consent, sessions and routing', '同意、会话与路由'], position: { x: 350, y: 160 }, source: sources.shell,
        detail: ['The broker is the shell’s request adapter. It prepares the allowed app/account peer, opens conversation sessions and routes input and output. Human sharing-context sessions and the system peer session keep separate transcripts while sharing bounded recent context.', 'Broker 是 Shell 的请求适配器，负责准备获准的应用／账户 Peer、打开会话并路由输入输出。用户共享上下文 session 与系统使用的 Peer session 分别保存记录，并共享有限的近期上下文。'] },
      { id: 'kernel', title: ['Shared agent kernel', '共享 Agent 内核'], owner: ['octos runtime', 'octos 运行时'], summary: ['Many peers, many tasks', '多个 Peer、多项任务'], position: { x: 700, y: 350 }, source: sources.kernel,
        detail: ['The shell shares one kernel runtime across app peers. A turn orchestration task waits at a start barrier; admission, ownership and acceptance precede its release and agent processing. A peer is not one Tokio task or one UI VM. Desktop/Android use a child process; OpenHarmony embeds the runtime.', 'Shell 的应用 Peer 共享内核运行时。Turn 编排任务先等待启动屏障；准入、归属记录与接受响应完成后才释放屏障并进行 Agent 处理。Peer 不等于一个 Tokio 任务或一个 UI VM。桌面／Android 使用子进程，OpenHarmony 嵌入运行时。'] },
      { id: 'peer', title: ['App peer', '应用 Peer'], owner: ['octos · app/account identity', 'octos · 应用／账户身份'], summary: ['Separate human + system sessions', '独立的用户与系统会话'], position: { x: 350, y: 370 }, source: sources.kernel,
        detail: ['A peer is a persistent app/account identity. Each session holds one conversation; the model processes its turn and requests only available tools. Host results return to that turn. Human answers go to their event receiver; results may also leave origin-labelled blackboard records (shared result records), without automatically waking the system agent for human turns.', 'Peer 是持久的应用／账户身份。每个 session 保存一段对话，模型处理其中的 turn 并仅请求可用工具。宿主结果返回该 turn。用户答案发给对应事件接收方；结果也可留下带来源标记的 blackboard（共享结果）记录，用户 turn 不会因此自动唤醒系统 Agent。'] },
      { id: 'tools', title: ['Authorized host tools', '获准的宿主工具'], owner: ['Shell service adapters', 'Shell 服务适配器'], summary: ['Declaration + grant + implementation', '声明 + 授权 + 实现'], position: { x: 0, y: 330 }, source: sources.hub,
        detail: ['Host adapters enforce scope and approval before executing operations. Cross-app tools also need the owner’s shareable declaration and caller grant; default App Hub admission rejects arbitrary names such as mail.send. Store-app script tool declarations still lack a dispatcher.', '宿主适配器在执行操作前落实范围与确认策略。跨应用工具还需所有者的共享声明与调用方授权；App Hub 默认准入拒绝 mail.send 等任意名称。商店应用的脚本工具声明仍缺少分发器。'] },
      { id: 'data', title: ['App records / account API', '应用记录／账户 API'], owner: ['App and host services', '应用与宿主服务'], summary: ['Separate from agent memory', '与 Agent 记忆分开'], position: { x: 0, y: 540 }, source: sources.shell,
        detail: ['The app’s business data is separate from transcripts and agent memory. Access needs an implemented tool. On Unix, consent plus an available exposed account workspace can enable bounded files.list/read/search; other app storage and host secrets are not automatically readable.', '应用业务数据与对话记录、Agent 记忆分开。访问需要已实现的工具。在 Unix 上，用户同意且开放的账户工作区可用时，可提供有界 files.list/read/search；其他应用存储与宿主密钥不会自动可读。'] },
    ],
    links: [
      { from: 'person', to: 'broker', label: ['input / answer', '输入／答案'], both: true, toSide: 'left' },
      { from: 'system', to: 'broker', label: ['delegate / result', '委派／结果'], both: true, toSide: 'right' },
      { from: 'broker', to: 'peer', label: ['turn / events', 'turn／事件'], both: true },
      { from: 'kernel', to: 'system', label: ['runs', '运行'], ownership: true, fromSide: 'right', toSide: 'right' },
      { from: 'kernel', to: 'peer', label: ['hosts', '承载'], ownership: true, fromSide: 'left', toSide: 'right' },
      { from: 'peer', to: 'tools', label: ['tool / result', '工具／结果'], both: true, fromSide: 'left', toSide: 'right' },
      { from: 'tools', to: 'data', label: ['operation / data', '操作／数据'], both: true },
    ],
  },
};
