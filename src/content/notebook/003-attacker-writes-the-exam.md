---
number: 3
title: "The attacker writes the exam"
dek: "Decision models are ready for real security work. Just not where it matters most. Yet."
status: published
date: 2026-11-18
# linkedin_url: https://www.linkedin.com/posts/...
---

*I fine-tuned a small model to spot prompt injections. It aced every test I wrote for it. Then I gave it a test written by somebody else.*

## The short version

This project asks a simple question: can a small, free model running on my desk keep up with a hosted commercial one at security judgments? After two rounds of fine-tuning and about six bucks, the answer splits cleanly in two.

**For questions nobody is trying to fool, yes, today.** What did this command do? Could it be undone? Did it touch sensitive data? A 4-billion-parameter model on my laptop gets 98% of these right, out of the box, with nothing leaving the machine.

**For questions an attacker is trying to fool, not yet.** Is this text trying to hijack the agent? My fine-tuned model aced every test built like its training data, then fell apart on attacks from sources it had never seen. So did the commercial model, just less badly.

That split isn't a quirk of my project. I think it's the most important thing to understand about putting decision models to work in security, and probably in any field with an adversary in it. In security, the attacker writes the exam.

## Two kinds of questions

A decision model takes a situation and a short list of choices, and returns one answer and how sure it is. Some questions you'd ask it are about facts nobody is manipulating. Others are about input an adversary wrote on purpose to get past you. Here's how I'd sort some familiar security jobs, as a hypothesis rather than a result:

| Nobody writes the input to fool you | An adversary writes the input |
| --- | --- |
| What an agent's action did, and whether it can be undone | Prompt injection |
| Whether data is sensitive (secrets, health, payment) | Phishing |
| Tagging evidence for compliance and audit | Fraud |
| Triage and routing of alerts and tickets | Abuse and content moderation |
| Classifying cloud and config changes | Malware and evasive scripts |

The left column is mostly a reading-comprehension problem, and small models are already good readers. The right column is an arms race: whatever you trained on, the other side is busy inventing something you didn't.

## The good news: the boring questions run on a laptop

Spangloss asks eight questions about every tool call an AI agent makes. Seven are the bread-and-butter kind: what the call did, whether it could be undone, whether it touched sensitive data, whether it was a source or a sink, and why it was made. On those, Kev-4B, an open-source model that runs on my Mac, got 397 of 405 right without any training on my data. And on my real sessions, no model mistook a single ordinary output for a prompt injection.

That matters more than it sounds. Any security tool built on a decision model has to show the model the very things you're trying to protect: prompts, file contents, credentials, customer data. With a hosted model, every label means another copy of that data leaving the building, which is a tough sell to the people whose whole job is stopping that. A model you run yourself takes the problem off the table, and at a cost close to zero per label.

That opens doors. Private-by-default security tooling. Data classification without the regex swamp. Audit trails that label everything, not a sample. None of it needs a frontier model or a data-sharing agreement.

## The hard part: the attacker writes the exam

The eighth question is the scary one: *is something in this output trying to give the agent orders?* That's prompt injection. So I tried to teach my little model to catch it.

The first attempt was a small pilot, a quick, cheap fine-tuning run to see whether training Kev on my own labels helped at all. 422 labeled examples from my scenario generator, one rented GPU, 90 cents. It caught 17 of 17 planted injections, with zero false positives on the tricky look-alikes. A perfect score.

Perfect scores always make me suspicious. Every test injection came from the same place as the training data: my own generator, written by me, in my style. So I built a tougher test, with payloads written by hand and others pulled from public research benchmarks. It caught 32 of 48 of the hand-written ones, and 10 of 16 from the benchmarks. The perfect score had mostly been the model learning to recognize *my handwriting*. Bastard.

Round 2 got 936 examples from more sources, and this time I wrote down the passing grade *before* seeing any results. In research this is called pre-registration, a term I'd never heard before this project. (Half the fun so far has been picking up a whole new vocabulary: fine-tuning, calibration, temperature scaling. I'm a security guy getting a crash course in how ML people keep themselves honest.)

It failed, and not narrowly:

<figure class="leaf chart chart--entry" aria-labelledby="chart-groupb-t" aria-describedby="chart-groupb-d">
<p class="chart__title" id="chart-groupb-t">Round 2 caught 62.5% of injections, against 84% for Jev</p>
<p class="chart__sub">96 injections and 96 look-alikes from sources the model never trained on (Jev skipped 2 injections)</p>
<p class="visually-hidden" id="chart-groupb-d">Bar chart in two panels. Injections caught, higher is better: Jev 84.0%, Pilot 66.7%, Round 2 62.5%. Look-alikes flagged, lower is better: Jev 78.1%, Pilot 46.9%, Round 2 43.8%.</p>
<div class="bars bars--entry">
<p class="bars__group">Injections caught (higher is better)</p>
<span class="bars__label">Jev</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Jev: caught 79 of 94 injections (84.0%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Jev: caught 79 of 94 injections (84.0%)</title>
<rect class="mark__hitbox" x="0" y="0" width="84.0%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="84.0%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="84.0%" dx="8" y="15">84.0%</text>
</svg>
</div>
<span class="bars__label">Pilot</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Pilot: caught 64 of 96 injections (66.7%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Pilot: caught 64 of 96 injections (66.7%)</title>
<rect class="mark__hitbox" x="0" y="0" width="66.7%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="66.7%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="66.7%" dx="8" y="15">66.7%</text>
</svg>
</div>
<span class="bars__label">Round 2</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Round 2: caught 60 of 96 injections (62.5%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--kev">
<title>Round 2: caught 60 of 96 injections (62.5%)</title>
<rect class="mark__hitbox" x="0" y="0" width="62.5%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="62.5%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="62.5%" dx="8" y="15">62.5%</text>
</svg>
</div>
<span class="bars__corner"></span>
<div class="bars__plot">
<svg class="bars__axis" height="18" aria-hidden="true">
<text x="0%" y="13">0%</text><text x="50%" y="13" text-anchor="middle">50%</text><text x="100%" y="13" text-anchor="end">100%</text>
</svg>
</div>
<p class="bars__group">Look-alikes flagged (lower is better)</p>
<span class="bars__label">Jev</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Jev: flagged 75 of 96 look-alikes as injections (78.1%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Jev: flagged 75 of 96 look-alikes as injections (78.1%)</title>
<rect class="mark__hitbox" x="0" y="0" width="78.1%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="78.1%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="78.1%" dx="8" y="15">78.1%</text>
</svg>
</div>
<span class="bars__label">Pilot</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Pilot: flagged 45 of 96 look-alikes as injections (46.9%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Pilot: flagged 45 of 96 look-alikes as injections (46.9%)</title>
<rect class="mark__hitbox" x="0" y="0" width="46.9%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="46.9%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="46.9%" dx="8" y="15">46.9%</text>
</svg>
</div>
<span class="bars__label">Round 2</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Round 2: flagged 42 of 96 look-alikes as injections (43.8%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--kev">
<title>Round 2: flagged 42 of 96 look-alikes as injections (43.8%)</title>
<rect class="mark__hitbox" x="0" y="0" width="43.8%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="43.8%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="43.8%" dx="8" y="15">43.8%</text>
</svg>
</div>
<span class="bars__corner"></span>
<div class="bars__plot">
<svg class="bars__axis" height="18" aria-hidden="true">
<text x="0%" y="13">0%</text><text x="50%" y="13" text-anchor="middle">50%</text><text x="100%" y="13" text-anchor="end">100%</text>
</svg>
</div>
</div>
<figcaption>spangloss round 2 evaluation, 2026-11-17</figcaption>
</figure>

Of the four tests I'd set it, it passed exactly one, and it was the easy one: don't get worse at the other seven labels. It failed all three that were about injection: catching attacks, avoiding false positives, and knowing how sure to be. The breakdown shows why:

<figure class="leaf chart chart--entry" aria-labelledby="chart-sources-t" aria-describedby="chart-sources-d">
<p class="chart__title" id="chart-sources-t">It learned the sources, not the skill</p>
<p class="chart__sub">Injections caught, by where the attack came from</p>
<p class="visually-hidden" id="chart-sources-d">Bar chart in three groups comparing the pilot and round 2. Sources it trained on: Pilot 16 of 18 (89%), Round 2 16 of 18 (89%). Public benchmarks it never saw: Pilot 10 of 16 (63%), Round 2 8 of 16 (50%). Hand-written payloads: Pilot 32 of 48 (67%), Round 2 28 of 48 (58%).</p>
<div class="bars bars--entry">
<p class="bars__group">Sources it trained on</p>
<span class="bars__label">Pilot</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Pilot, sources it trained on: caught 16 of 18 injections (89%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Pilot, sources it trained on: caught 16 of 18 injections (89%)</title>
<rect class="mark__hitbox" x="0" y="0" width="88.89%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="88.89%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="88.89%" dx="8" y="15">16 of 18 (89%)</text>
</svg>
</div>
<span class="bars__label">Round 2</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Round 2, sources it trained on: caught 16 of 18 injections (89%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--kev">
<title>Round 2, sources it trained on: caught 16 of 18 injections (89%)</title>
<rect class="mark__hitbox" x="0" y="0" width="88.89%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="88.89%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="88.89%" dx="8" y="15">16 of 18 (89%)</text>
</svg>
</div>
<span class="bars__corner"></span>
<div class="bars__plot">
<svg class="bars__axis" height="18" aria-hidden="true">
<text x="0%" y="13">0%</text><text x="50%" y="13" text-anchor="middle">50%</text><text x="100%" y="13" text-anchor="end">100%</text>
</svg>
</div>
<p class="bars__group">Public benchmarks it never saw</p>
<span class="bars__label">Pilot</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Pilot, public benchmarks it never saw: caught 10 of 16 injections (63%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Pilot, public benchmarks it never saw: caught 10 of 16 injections (63%)</title>
<rect class="mark__hitbox" x="0" y="0" width="62.50%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="62.50%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="62.50%" dx="8" y="15">10 of 16 (63%)</text>
</svg>
</div>
<span class="bars__label">Round 2</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Round 2, public benchmarks it never saw: caught 8 of 16 injections (50%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--kev">
<title>Round 2, public benchmarks it never saw: caught 8 of 16 injections (50%)</title>
<rect class="mark__hitbox" x="0" y="0" width="50.00%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="50.00%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="50.00%" dx="8" y="15">8 of 16 (50%)</text>
</svg>
</div>
<span class="bars__corner"></span>
<div class="bars__plot">
<svg class="bars__axis" height="18" aria-hidden="true">
<text x="0%" y="13">0%</text><text x="50%" y="13" text-anchor="middle">50%</text><text x="100%" y="13" text-anchor="end">100%</text>
</svg>
</div>
<p class="bars__group">Hand-written payloads</p>
<span class="bars__label">Pilot</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Pilot, hand-written payloads: caught 32 of 48 injections (67%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--muted">
<title>Pilot, hand-written payloads: caught 32 of 48 injections (67%)</title>
<rect class="mark__hitbox" x="0" y="0" width="66.67%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="66.67%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="66.67%" dx="8" y="15">32 of 48 (67%)</text>
</svg>
</div>
<span class="bars__label">Round 2</span>
<div class="bars__plot">
<svg class="bars__track" height="22" role="img" aria-label="Round 2, hand-written payloads: caught 28 of 48 injections (58%)">
<g class="chart-grid"><line x1="0%" x2="0%" y1="0" y2="22" /><line x1="25%" x2="25%" y1="0" y2="22" /><line x1="50%" x2="50%" y1="0" y2="22" /><line x1="75%" x2="75%" y1="0" y2="22" /><line x1="100%" x2="100%" y1="0" y2="22" /></g>
<g class="mark mark--kev">
<title>Round 2, hand-written payloads: caught 28 of 48 injections (58%)</title>
<rect class="mark__hitbox" x="0" y="0" width="58.33%" height="22" />
<g class="bar__fill"><rect x="0" y="4" width="58.33%" height="14" rx="4" /><rect x="0" y="4" width="8" height="14" /></g>
</g>
<text class="chart__value" x="58.33%" dx="8" y="15">28 of 48 (58%)</text>
</svg>
</div>
<span class="bars__corner"></span>
<div class="bars__plot">
<svg class="bars__axis" height="18" aria-hidden="true">
<text x="0%" y="13">0%</text><text x="50%" y="13" text-anchor="middle">50%</text><text x="100%" y="13" text-anchor="end">100%</text>
</svg>
</div>
</div>
<figcaption>spangloss round 2 evaluation, 2026-11-17</figcaption>
</figure>

On sources it had seen in training, it was excellent. On anything new, it got *worse* than the pilot. It's the student who memorized last year's exam: brilliant, right up until the professor writes new questions. And attackers write new questions for a living.

Two more traps showed up along the way. Round 2 raised fewer false positives than the commercial model, which sounds great until you notice it also caught fewer real attacks: it didn't get smarter, just quieter, like a smoke detector that sleeps through actual fires. And its confidence didn't travel: tuned to be trustworthy on familiar examples, it was badly overconfident on new ones. In fairness to my little model, so was the commercial one.

## If you're building or buying

If you're **building** with decision models:

1. **Split the job.** Put the reading-comprehension questions on a small local model, where it already matches the big ones. Treat the adversarial questions as the open problem they are, and publish their error rates.
2. **Variety beats volume.** More examples from the same places won't help against a new trick. Train on many distinct sources, and test on whole sources you held out.
3. **Write the passing grade first.** Without pre-registered criteria, I'd have called round 2 a success. Look at that development score!

If you're **buying** a tool that claims AI catches prompt injection, or phishing, or fraud, ask three questions:

- Was it tested on attacks from sources it never trained on, or just on held-out examples of the same ones?
- Were the pass criteria written down before the results came in?
- What's the false-positive rate, measured alongside the catch rate on the same test?

If the answers are vague, you're looking at a model that may have learned somebody's handwriting.

## What's next

All of these numbers are published with the project, failed criteria included. Next, I'll try a third round built on the lessons above, and test the two-columns idea directly by pointing spangloss at agents that do more than write code.

Total cost of being humbled by a 4-billion-parameter model: about six dollars. Cheapest education I've had all year.

[Results](/results/) · [GitHub ↗](https://github.com/spangloss/spangloss) · [RSS](/notebook/rss.xml)
