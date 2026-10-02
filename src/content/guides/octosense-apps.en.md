# Run an app, then follow its agent

OctoScript describes workflows and interfaces. OctoSense hosts apps and connects them to **octos**, the Rust agent kernel. This guide follows an app from its source to a running UI, then follows a person's request through its app agent.

The coding agent that helps write an app and the app agent that answers its users are separate roles. Development instruments inspect a running UI; app agents use the tools and data granted by the product host.

## Choose what you are running

| Artifact | Runtime | Start here |
| --- | --- | --- |
| Workflow `.octoscript` | OctoScript's bounded workflow runtime, with registered tools and host-issued grants | The [workflow example](why-octoscript.en.md#what-happens-around-one-call) |
| Native Rust app | A compiled `AppModule` with Rust event handlers and Makepad widgets | [OctoSense build and run instructions](https://github.com/OctoSense-org/OctoSense/blob/main/README.md) |
| Contained `main.splash` app | Makepad Script evaluated inside a Splash UI host | Design Flow's `tools/octo run` and App Hub's `card-host` |
| L0 `page.card` with data and a kit | OctoScript checks and realizes the card; OctoScript-Makepad lowers and renders it | The same card host, with the declared data and kit files |

`tools/octo` is a Python development command. It starts the Rust card host; it is not the `octos` agent kernel. A native Rust app can embed a Splash view while keeping its services in compiled Rust.

## Run a contained app locally

Use [Design Flow's native workspace setup](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/NATIVE-WORKSPACE.md) to prepare the repositories and build prerequisites. Its runtime lock selects compatible source revisions.

**Recipe status:** these native build and launch commands have not been executed as part of the website checks.

From the Design Flow checkout:

```sh
python3 tools/setup-native.py
python3 tools/setup-native.py --check
```

From the App Hub sibling:

```sh
cargo build --release -p octosense-card-host -p octosense-app-hub
```

Return to Design Flow and use a new destination directory and a free port:

```sh
tools/octo doctor
tools/octo new /tmp/octosense-notes --id walkthrough.notes --name "Notes"
tools/octo run /tmp/octosense-notes/bundle --hidden --detach --port 8141
tools/octo shot 8141 /tmp/octosense-notes/first-frame.png
curl -s http://127.0.0.1:8141/quit
```

`run` takes the bundle path as a positional argument. With `--detach`, it returns after the new process exposes its UI and a rendered frame; without it, the terminal waits for the app to exit. The default development run stamps the manifest, so use an unsigned working copy.

This tests parsing, rendering and the host's contained storage and network policy. Standalone `card-host` registers **no host services and no agent runtime**. It cannot complete `mail.*`, `model.complete` or `octos.*` requests. Use the [local signed-catalog rehearsal](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/PUBLISHING.md#4-rehearse-the-store-path-locally) to test an installed app inside the full shell. Desktop, Android Home and ROM commands belong to the OctoSense repository; a ROM build also includes the operating system.

## From card source to native widgets

**Realization** checks the card's declared data and state and expands its components into a complete tree. **Lowering** converts that tree into the more detailed source needed by a component kit and renderer.

```text
page.card + host data + instance state
  → OctoScript L0 check and realization
  → component-kit lowering
  → checked evaluation into renderer UiNode data
  → Makepad widget source
  → native host mounts a View and handles events
```

The realized L0 tree and the renderer's `UiNode` are different representations. Native kits load `native/<mood>/kit.json` and use the measured-design path; other kits assemble palette and component source. In either case the host supplies data, registers widgets, handles actions and decides when to render again.

In the framework's catalog and preview hosts, the final widget source is evaluated on the app's main `makepad-script` VM and its `View` is assigned to `Splash.view`. App Hub's contained script host has its own admission and isolate setup. Sharing the VM implementation does not give every app the same instance, bindings or permissions. Follow the [renderer code walkthrough](https://github.com/OctoSense-org/OctoScript-Makepad/blob/fb29b6b1cb6e16f38d99a8aef60431a9565dfd59/docs/architecture-walkthrough.md) for the exact calls and the different evaluation budgets.

## Follow “Summarize my saved notes”

Assume the app has stored notes in its exposed account folder and the person has allowed its agent in OctoSense. A **peer** is that app agent's identity; a **session** holds one conversation and its transcript; a **turn** is one request and the model/tool work needed to answer it.

1. The person opens desktop **Ask &lt;app&gt;** and sends the request. The shell selects the app peer and its human conversation. An app can also provide a chat surface through the shell's `octos.*` service.
2. The shell starts a turn with the person's origin. Octos admits the turn, records ownership and starts model processing. The model can request a tool; its text does not authorize access.
3. On Unix, the shell can expose bounded `files.list`, `files.read` and `files.search` tools when the person has consented and an account workspace is available. These tools read the exposed account folder. Records at the app's storage root, and host-service secrets outside that folder, are not automatically readable.
4. The tool result returns to the model, which writes an answer. Events and completion go back to the human conversation that submitted the request.

A UI's data store, the conversation transcript and the agent's memory are separate stores. For structured records elsewhere, the app needs an implemented tool that interprets those records; shipping a tool declaration alone does not make that operation executable.

The system agent can delegate the same request using the app peer's actual identifier. Its request uses the peer's system conversation; human chat can use a separate session that shares bounded recent context. Each keeps its own transcript. Human answers go to that conversation's event receiver. Both origins can leave labelled results in the **peer blackboard**, the coordination record; a human-origin result does not automatically wake the system agent. The system agent gathers the results of its delegated requests.

## Calling another app or the system agent

Cross-app calls require an owner's shareable tool declaration, the caller's grant, host admission and an executable route. Approval applies where the tool's policy requires it. App Hub's default offered-tool list excludes arbitrary names such as `mail.send`; adding that name to `agent.tools` fails default admission.

System-to-app delegation is implemented. A contained app does not inherit the system agent's tools or gain unrestricted app-to-system delegation. It can use only coordination routes the host actually supplies and authorizes.

| Declaration or feature | Current integration boundary |
| --- | --- |
| First-party `implemented_by: "host-service"` tools | Run through registered Rust services under the host's policy. |
| Store app `implemented_by: "app"` tools | The current shell has no script dispatcher for these declarations. Opening the UI does not install one. |
| Bundle `AGENT.md` and skills | App Hub validates them; the current shell does not install their contents into app peers. Repository `AGENTS.md` instead instructs the coding agent. |
| Model `needs`, background triggers and scheduling metadata | Validation does not supply the missing runtime selection or scheduling behavior. |
| L0 `sys.chat` / `ChatEntry` | Supported by the shell's runtime, but absent from the current Design Flow authoring pin. Check [AI services and runtime compatibility](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/main/docs/AI-SERVICES.md#ai-written-text-and-in-card-chat-model-copy-syschat) before authoring such cards. |

## Where Tokio fits

A peer can exist while no task is running. When handling a request, Octos spawns turn orchestration behind a **start barrier**. It checks admission, records ownership and sends acceptance before releasing the barrier; a refusal aborts the waiting task. Orchestration then spawns the agent processing task. A host-tool call waits on a one-result channel while Tokio can schedule other work; the host decides where the actual database or network operation executes.

Transport and event forwarding add other tasks. Card/VM evaluation and UI events follow the UI host's scheduling; a peer is neither one Tokio task nor one UI VM. The shell shares a kernel runtime across app peers. Desktop and Android normally run it as a child process, OpenHarmony embeds it, and iOS currently has no integrated kernel. Follow the [octos request and task walkthrough](https://github.com/octos-org/octos/blob/82900bf149d3a53016c1c1492ffc075d2d4fb0ed/docs/octosense-integration-walkthrough.md) for admission, cancellation and reply correlation.

## Continue in the source repositories

- [OctoSense](https://github.com/OctoSense-org/OctoSense/blob/61c668279a7c38a0f8056134d8d29e42ed715806/docs/architecture-walkthrough.md): native apps, desktop/Home/ROM, conversation entry points and the shell broker.
- [App Hub](https://github.com/OctoSense-org/OctoSense-App-Hub/blob/19bb52d402e80e89e085dea989615e3ec612d359/docs/CODE-WALKTHROUGH.md): admission, installation, contained storage and host-service requests.
- [Design Flow](https://github.com/OctoSense-org/OctoScript-App-Design-Flow/blob/218b25d2460d64f843932f67d419467618464fb9/docs/CODE-WALKTHROUGH.md): CLI behavior, image/card stages and publication hand-off.

Read the source revision selected by the consuming app's Cargo and runtime locks. The website's prebuilt WASM lab has its own pinned build receipt and uses local demo state; it does not connect to a production OctoSense app agent or account.
