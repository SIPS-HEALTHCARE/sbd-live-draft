---
name: ruflo
description: Enterprise AI agent orchestration for Claude Code. Deploy specialized agents in coordinated swarms with self-learning, vector memory, and MCP integration.
---

# Ruflo AI Orchestration Framework (v3.5)

Ruflo (formerly Claude Flow) is an enterprise-grade AI agent orchestration framework designed specifically for Claude Code. It enables the deployment of specialized agents in coordinated swarms with self-learning capabilities, vector memory, and fault-tolerant consensus.

## 🚀 Quick Start

Invoke Ruflo commands to manage your AI workforce:

- `/ruflo --help`: Display available commands and agent types.
- `/ruflo init`: Initialize Ruflo in the current workspace.
- `/ruflo doctor`: Check system requirements and installation health.

## 🐝 Swarm Orchestration

Use swarms for complex, multi-file tasks that require coordination:

- `/swarm init --topology hierarchical`: Initialize a team with a lead coordinator.
- `/swarm init --topology mesh`: Initialize a peer-to-peer network of agents.
- `/swarm start --objective "Implement feature X" --strategy development`: Launch the swarm.

## 🤖 Specialized Agents

Spawn agents for specific roles using the `/agent` command:

- `/agent spawn --type coder --name dev-1`: Add a coding specialist.
- `/agent spawn --type reviewer --name qa-lead`: Add a code reviewer.
- `/agent spawn --type architect --name arch-1`: Add a system designer.

**Supported Types:** `coordinator`, `coder`, `tester`, `reviewer`, `architect`, `researcher`, `security-architect`, `performance-engineer`.

## 🧠 Memory & Context

Ruflo maintains a persistent vector memory for learning from past tasks:

- `/memory search --query "authentication pattern"`: Retrieve relevant past implementations.
- `/memory store --key "project-alpha" --value "summary"`: Explicitly store task context.

## 🔌 MCP Integration

For deep tool integration, add Ruflo as an MCP server:
`claude mcp add ruflo -- npx -y ruflo@latest mcp start`

---
> **Note:** This skill is globally registered in your Skills workspace. Updates to the core Ruflo engine at `/Users/iiggie/Desktop/Antigravity/Anti Gravity MCP:Skills/ruflo` will be reflected here.
