---
number: 2
title: "Security’s hand-me-downs: what Claude Code’s telemetry doesn’t show"
dek: "Six gaps in Claude Code’s telemetry, and what they mean for anyone trying to secure AI agents."
status: published
date: 2026-11-09
# linkedin_url: https://www.linkedin.com/posts/...
---

Security has never had data of its own. We live on hand-me-downs. Syslog was built so admins could work out why the mail server fell over. Firewall logs, Windows event logs, CloudTrail: all made for somebody else’s job, then quietly adopted by security teams who learned to squint. We’re the younger sibling of IT, and the jeans never quite fit.

AI agent telemetry is the newest hand-me-down. It records the tool calls an agent makes, and spangloss labels those calls for security. So before trusting it, I went looking for what it leaves out. That meant taking Claude Code out for a joyride, with tool details and tool content logging turned on.

I found six gaps. For debugging, they’re annoying. For security, they’re a real problem, because five of the six sit on the side that matters most: not what the agent did, but what it was told. Below are the six, then what they mean for securing AI agents, including why the folks building gateways and eBPF probes may get the last laugh.

## 1. Long arguments are cut to 128 characters in the logs

In the log event for each tool result, any argument longer than 512 characters keeps only its first 128, followed by a short marker. In the sessions captured so far, that applied to 191 of 424 shell commands.

Some tools keep a complete copy elsewhere, and some don’t:

| Argument           | Complete copy            |
| ------------------ | ------------------------ |
| Shell command      | on the span              |
| File write content | in the output event      |
| Edit strings       | none (the diff survives) |
| Web fetch prompt   | none                     |
| Subagent prompt    | none                     |
| Subagent handback  | none                     |

The practical consequence: a pipeline that reads only the logs sees the start of a long command and never its end, which is exactly where a payload would go. Attackers usually have to work for that kind of evasion. Here the logs do it for free. The instructions handed to a subagent are among the things no copy of the telemetry keeps whole.

## 2. Search results are never captured

Grep and Glob calls carry no output at all. In the first scenario runs, none of the 8 searches recorded what it found. A security team can see that the agent searched a `.env` file, and never what came back. It’s like hearing someone open the fridge and never finding out what they ate.

## 3. A web fetch returns a summary, not the page

WebFetch passes the page through a model and returns that model’s answer. To test it, a seeded scenario served a page with two planted instructions for AI assistants: one in an HTML comment, one hidden with zero-width characters. In six fetches, every summary dropped the first entirely and reduced the second to a sentence saying it had been ignored.

<figure class="leaf">
<blockquote>“The page also contains hidden text addressed to AI assistants … so I ignored it and did not fetch the link.”</blockquote>
<figcaption>A WebFetch summary from one scenario run</figcaption>
</figure>

That’s a partial defense: the agent never sees the injected text. It’s also a blind spot: the trace records almost nothing of the attempt. Great news for the agent. Less great for whoever has to write the incident report. Fetching the same page with `curl` put the raw page, instructions and all, into the trace.

## 4. What a subagent hands back often goes unrecorded

In interactive sessions, the handback span has no output, and its message is truncated like any other long argument. In headless runs, no handback span appears at all. The subagent’s own calls are captured, but the text it returns to the main agent is not. The subagent reports back, and the telemetry has left the building.

## 5. MCP tool descriptions never appear

Tools from MCP servers are either loaded on demand through a tool-search call, whose spans carry no output, or placed up front in the system prompt, which no span records. Either way, the description the agent reads is not in the trace, so a poisoned tool description is invisible to monitoring built on it. The one place a poisoned tool would hide its instructions is the one place nobody writes down.

## 6. A project’s CLAUDE.md leaves no trace

This one is a doozy. Claude Code reads a `CLAUDE.md` in the working directory into the model’s context when a session starts, without a tool call. To test it, an isolated run put a unique codename in a `CLAUDE.md` and asked the agent for it, without using tools. The agent answered correctly and named the file as its source. The trace held two spans and no codename. The logs held it once, in the model’s own reply.

So a poisoned `CLAUDE.md` in a cloned repository steers the session without leaving anything to label. Only the calls it leads to show up. An instruction file the agent reads with a tool, such as an `AGENTS.md`, is an ordinary file read and is labeled like one. Which makes the most influential file in the repository the one the telemetry never mentions.

## What this means for securing AI agents

Agent telemetry was built to debug agents, and it shows. It records what the agent did far better than what the agent was told. Five of the six gaps sit on that inbound side: the instructions an agent starts with, the tools it is offered, the pages it reads, the results of its searches and what its subagents send back. That’s exactly where prompt injection lives. A monitor built only on these traces sees the effects of an attack, not its cause.

An agent’s instructions now have a supply chain: files in a cloned repository, MCP servers, installed packages, web pages. Most of those parties were never vetted, and in the telemetry that supply chain is close to invisible.

That’s why the other approaches in this market matter. Each one sits somewhere the traces don’t reach:

| Approach | What it sees | Gaps it helps close | What it misses |
| --- | --- | --- | --- |
| AI gateway, a proxy between the agent and the model API | Everything the model reads and writes: the system prompt, instruction files, tool descriptions, complete tool arguments, search results, subagent answers | All six (for gap 3, the page as the fetch passes it to the model) | What actually ran on the machine. It sees text, not actions tied to outcomes, and it only works if the agent can be routed through it |
| MCP gateway | Tool listings, and every call and result for the servers behind it | 5 | Built-in tools and instruction files |
| Agent hooks, such as Claude Code’s pre- and post-tool hooks | Each tool call’s full input and, for calls that succeed, its output, before or after it runs, with the power to block it | 1, 2, 4, and prevention, which telemetry can’t offer | Anything that reaches the model without a tool call, such as a `CLAUDE.md` |
| eBPF probes or endpoint monitoring on the agent’s host | Processes, file opens and network connections, whatever the agent reports about itself | The ground truth behind all six | Why: the instruction or intent behind an action |
| Egress proxy | The raw responses that leave or enter the network, with TLS inspection | 3, where the fetch crosses it | Anything that stays on the machine |

No single layer sees everything. Defense in depth is a cliché because it keeps being true. Spans give structure: which call, under which subagent, with what result. A gateway shows what the model was told. Runtime monitoring shows what actually happened. Hooks can stop it. That first layer is the one spangloss works on, and it says so; the others are what close the gaps above.

Two lessons hold whichever layers you run. First, defenses inside the agent can erase the evidence: WebFetch’s summarizer kept planted instructions away from the agent and out of the trace, which leaves an analyst nothing to review. Guardrails that rewrite input should record what they removed. Second, missing evidence is not a clean result. Monitoring for agents should say what each conclusion rests on, and treat a gap as unknown, never as safe.

Some of this needs the vendors. If agent telemetry recorded which instruction files and tool descriptions were loaded, even as a path and a hash, the two largest blind spots would close without logging their content.

## What spangloss does about it

It can’t restore what was never captured, so it’s upfront about it instead. Every label records its evidence basis: tool name only, arguments, or full content. Where content is missing, a location rule applies: a search of `.env` counts as touching secrets. Where the span’s structure identifies a source, code sets the label instead of a model: a result from a third-party MCP server counts as untrusted input, whatever it says. Provenance a model can’t see is carried by deterministic rules, such as one that follows untrusted content back through a subagent. And each gap is documented, so a result can be read for what it can and cannot show.

<div class="aside leaf">
<p class="aside__head">SCOPE AND SOURCES</p>
<p>Observed in Claude Code 2.1.312; later versions may differ. Counts come from lengths and field names only, never content. Full method and evidence: <a href="https://github.com/spangloss/spangloss/blob/main/docs/findings/capture-gaps.md">capture-gaps.md ↗</a>. Reported to Anthropic as a documentation issue (<a href="https://github.com/anthropics/claude-code/issues/106614">#106614 ↗</a>) and a feature request (<a href="https://github.com/anthropics/claude-code/issues/106615">#106615 ↗</a>). The sixth gap was found after those reports and isn’t in them yet.</p>
</div>
