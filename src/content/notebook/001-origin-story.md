---
number: 1
title: "I gave a tiny model my AI agent’s diary"
dek: "Why a DLP veteran started teaching small decision models to read AI agents’ telemetry."
status: draft
# date: "[DATE]"                       # required once status is published
# linkedin_url: "[LINKEDIN POST URL]"
---

Every AI agent keeps a diary. It’s called an OpenTelemetry trace, it records every file the agent opened and every command it ran, and almost nobody reads it for security.

I’ve started a side project to change that. Partly because I couldn’t stop poking at a new kind of model. Partly because of scar tissue.

## The itch: decision models

In September, TypeSafe released Jev, a “decision model.” It doesn’t write you an essay or a catchy online dating profile. You hand it a situation and a short list of choices, and it hands back one answer and how sure it is. No prose, no “Great question!”, just a typed answer and a probability, in well under a second.

My first thought was the one every security person has about every new tool: how would I fool this? My second thought was better: this is exactly the shape of a security decision. Is this file sensitive? Is this command destructive? Is this web page trying to give my agent orders? Yes, no, and how sure are you.

## The scar tissue: heuristics

I spent 8 years building detection engines for data loss prevention (DLP). If you’ve never had the pleasure, here’s how it goes. You write a rule. It catches the thing. It also catches eleven things that aren’t the thing. You add an exception. The exception needs an exception. Two years later you have something akin to a regular expression on steroids that nobody understands and everybody is afraid to delete.

Heuristics are brittle, and the brittleness compounds. Decision models offer a different bargain: describe the judgment in plain language, get back an answer with a confidence attached, and measure how often it’s right. Whether that bargain actually holds up is the whole point of this project.

## Why agent traces

AI agents are non-deterministic, which is a polite way of saying nobody is entirely sure what the hell they’ll do next. So the teams building them have started tracing everything, to see what the agent actually did and why. Developers need those traces for debugging anyway.

That makes them a natural insertion point for security. The data is already flowing. Nobody has to install yet another agent on yet another endpoint. And you don’t block anything, so you can’t break anything either.

So: spangloss. It sits beside that telemetry pipeline, reads each tool call an agent makes, and writes a short, typed note next to it. What did the call do? What data did it touch? Did something in its output try to steer the agent? And how sure are we? Those notes are glosses, written on spans, hence the name.

It isn’t meant to replace anything. Think of it as one more layer in a defense-in-depth strategy: cheap, low-friction visibility into what your agents are doing, built on data you’re already collecting.

## Two questions I want answered

**1. Are decision models actually good at security judgments?** Not “does the demo work,” because demos always work. I mean: on a labeled set of real agent behavior, how often is the model right, and does its confidence mean anything? When it says 90%, is it right nine times out of ten, or is that just a number it likes?

**2. Can a small, free model I run myself keep up with a hosted one?** I’m testing Jev against Kev, an open-source rebuild of the same idea that runs on a laptop and can be fine-tuned on your own data. If a 4-billion-parameter model on my desk can get close to a commercial service, the economics of security labeling change, and nothing sensitive ever has to leave the building. If it can’t, I’d like to know by how much, and where.

## What I’ve found so far

It’s early, and the honest results come with v0. But a few things have already surprised me:

- **The “diary” has missing pages.** Claude Code’s logs cut long tool arguments down to their first 128 characters. Search results are never recorded at all. And the descriptions of tools an agent loads from MCP servers don’t appear anywhere, which is awkward, since that’s exactly where a poisoned tool would hide its instructions.
- **More context made the model worse.** When I let the model read a file’s contents before answering simple questions about it, it got distracted by the text and labeled a plain read of a local file as an outbound send from an untrusted source.
- **Asking nicely doesn’t work.** Adding a note to a model’s instructions moved its confidence but almost never changed its answer. Computing the fact in code, instead of asking for it, fixed the problem outright.
- **The best defense left no fingerprints.** A web-fetch tool quietly neutralized every injection I planted in a test page, and left almost no trace in the telemetry that an attack had been attempted.

## What’s next

I’ll be writing in more detail on my findings over the coming weeks. Some of this includes:

- **What Claude Code’s telemetry doesn’t show:** the missing pages, measured.
- **A prompt note moves probabilities, not answers:** why spangloss computes facts instead of asking for them.
- **The summarizer that hides the attack:** good news for the agent, bad news for whoever is watching it.
- **Gold by construction:** scripted agent sessions that label themselves, for about a cent a run.

The target is a public v0 by the end of November, with the full label taxonomy and per-label results for both models, warts included.

If you run AI agents anywhere near production and any of this sounds familiar, I’d love to hear what you’re seeing. And if you’ve struggled through the pain of developing a rules-based engine for security that’s come under siege by false positives, I understand. I’ve been there.

[GitHub](https://github.com/spangloss/spangloss) · [LinkedIn]([YOUR LINKEDIN URL]) · [RSS](/notebook/rss.xml)
