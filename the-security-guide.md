# The Shorthand Guide to Everything Agentic Security

---

It's been a while since my last article now. Spent time working on building out the ECC devtooling ecosystem. One of the few hot but important topics during that stretch has been agent security.

Widespread adoption of open source agents is here. OpenClaw and others run about your computer. Continuous run harnesses like Claude Code and Codex (using ECC) increase the surface area; and on February 25, 2026, Check Point Research published a Claude Code disclosure that should have ended the "this could happen but won't / is overblown" phase of the conversation for good.

The tooling we trust is also the tooling being targeted. That is the shift. Prompt injection is no longer some goofy model failure or a funny jailbreak screenshot; in an agentic system it can become shell execution, secret exposure, workflow abuse, or quiet lateral movement.

---

## Attack Vectors / Surfaces

Attack vectors are essentially any entry point of interaction. The more services your agent is connected to the more risk you accrue. Foreign information fed to your agent increases the risk.

### Attack Chain and Nodes / Components Involved

E.g., my agent is connected via a gateway layer to WhatsApp. An adversary knows your WhatsApp number. They attempt a prompt injection using an existing jailbreak. They spam jailbreaks in the chat. The agent reads the message and takes it as instruction. It executes a response revealing private information. If your agent has root access, or broad filesystem access, or useful credentials loaded, you are compromised.

GitHub PR reviews are another target. Malicious instructions can live in hidden diff comments, issue bodies, linked docs, tool output, even "helpful" review context.

MCP servers are another layer entirely. They can be vulnerable by accident, malicious by design, or simply over-trusted by the client. A tool can exfiltrate data while appearing to provide context or return the information the call is supposed to return. OWASP now has an MCP Top 10 for exactly this reason.

---

## Claude Code CVEs (February 2026)

Check Point Research published the Claude Code findings on February 25, 2026.

**CVE-2025-59536.** Project-contained code could run before the trust dialog was accepted.

**CVE-2026-21852.** An attacker-controlled project could override `ANTHROPIC_BASE_URL`, redirect API traffic, and leak the API key before trust confirmation.

**MCP consent abuse.** Check Point also showed how repo-controlled MCP configuration and settings could auto-approve project MCP servers before the user had meaningfully trusted the directory.

It's clear how project config, hooks, MCP settings, and environment variables are part of the execution surface now.

---

## The Risk Quantified

| Stat | Detail |
|------|--------|
| **CVSS 8.7** | Claude Code hook / pre-trust execution issue: CVE-2025-59536 |
| **31 companies / 14 industries** | Microsoft's memory poisoning writeup |
| **3,984** | Public skills scanned in Snyk's ToxicSkills study |
| **36%** | Skills with prompt injection in that study |

---

## Sandboxing

Root access is dangerous. Broad local access is dangerous. Long-lived credentials on the same machine are dangerous. The answer is isolation.

### Separate the identity first

Do not give the agent your personal Gmail. Create `agent@yourdomain.com`. Do not give it your main Slack. Create a separate bot user or bot channel. Do not hand it your personal GitHub token. Use a short-lived scoped token or a dedicated bot account.

### Run untrusted work in isolation

For untrusted repos, attachment-heavy workflows, or anything that pulls lots of foreign content, run it in a container, VM, devcontainer, or remote sandbox.

```yaml
services:
  agent:
    build: .
    user: "1000:1000"
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    networks:
      - agent-internal

networks:
  agent-internal:
    internal: true
```

`internal: true` matters. If the agent is compromised, it cannot phone home unless you deliberately give it a route out.

### Restrict tools and paths

If your harness supports tool permissions, start with deny rules around the obvious sensitive material:

```json
{
  "permissions": {
    "deny": [
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(**/.env*)",
      "Write(~/.ssh/**)",
      "Write(~/.aws/**)",
      "Bash(curl * | bash)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(nc *)"
    ]
  }
}
```

---

## Sanitization

Everything an LLM reads is executable context. There is no meaningful distinction between "data" and "instructions" once text enters the context window. Sanitization is not cosmetic; it is part of the runtime boundary.

### Hidden Unicode and Comment Payloads

Invisible Unicode characters are an easy win for attackers because humans miss them and models do not. Zero-width spaces, word joiners, bidi override characters, HTML comments, buried base64; all of it needs checking.

### Sanitize attachments before the model sees them

If you process PDFs, screenshots, DOCX files, or HTML, quarantine them first.

Practical rule:
- extract only the text you need
- strip comments and metadata where possible
- do not feed live external links straight into a privileged agent
- if the task is factual extraction, keep the extraction step separate from the action-taking agent

---

## Approval Boundaries / Least Agency

The model should not be the final authority for shell execution, network calls, writes outside the workspace, secret reads, or workflow dispatch.

This is where a lot of people still get confused. They think the safety boundary is the system prompt. It is not. The safety boundary is the policy that sits BETWEEN the model and the action.

GitHub's coding-agent setup is a good practical template here:
- only users with write access can assign work to the agent
- lower-privilege comments are excluded
- agent pushes are constrained
- internet access can be firewall-allowlisted
- workflows still require human approval

---

## Observability / Logging

If you cannot see what the agent read, what tool it called, and what network destination it tried to hit, you cannot secure it.

Log at least these:
- tool name
- input summary
- files touched
- approval decisions
- network attempts
- session / task id

---

## Kill Switches

Know the difference between graceful and hard kills. `SIGTERM` gives the process a chance to clean up. `SIGKILL` stops it immediately. Both matter.

Also, kill the process group, not just the parent. If you only kill the parent, the children can keep running.

For unattended loops, add a heartbeat. If the agent stops checking in every 30 seconds, kill it automatically.

---

## Memory

Persistent memory is useful. It is also gasoline.

You usually forget about that part though right? I mean whose constantly checking their .md files that are already in the knowledge base you've been using for so long. The payload does not have to win in one shot. It can plant fragments, wait, then assemble later.

Anthropic documents that Claude Code loads memory at session start. So keep memory narrow:
- do not store secrets in memory files
- separate project memory from user-global memory
- reset or rotate memory after untrusted runs
- disable long-lived memory entirely for high-risk workflows

---

## The Minimum Bar Checklist

If you are running agents autonomously in 2026, this is the minimum bar:
- separate agent identities from your personal accounts
- use short-lived scoped credentials
- run untrusted work in containers, devcontainers, VMs, or remote sandboxes
- deny outbound network by default
- restrict reads from secret-bearing paths
- sanitize files, HTML, screenshots, and linked content before a privileged agent sees them
- require approval for unsandboxed shell, egress, deployment, and off-repo writes
- log tool calls, approvals, and network attempts
- implement process-group kill and heartbeat-based dead-man switches
- keep persistent memory narrow and disposable
- scan skills, hooks, MCP configs, and agent descriptors like any other supply chain artifact

---

## The Tooling Landscape

The good news is the ecosystem is catching up. Not fast enough, but it is moving.

Anthropic has hardened Claude Code and published concrete security guidance around trust, permissions, MCP, memory, hooks, and isolated environments.

GitHub has built coding-agent controls that clearly assume repo poisoning and privilege abuse are real.

OWASP has an MCP Top 10.

Snyk's `agent-scan` and related work are useful for MCP / skill review.

---

## Close

If you are running agents autonomously, the question is no longer whether prompt injection exists. It does. The question is whether your runtime assumes the model will eventually read something hostile while holding something valuable.

Build as if malicious text will get into context.
Build as if a tool description can lie.
Build as if a repo can be poisoned.
Build as if memory can persist the wrong thing.
Build as if the model will occasionally lose the argument.

Then make sure losing that argument is survivable.

If you want one rule: never let the convenience layer outrun the isolation layer.
