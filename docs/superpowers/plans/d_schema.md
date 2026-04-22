# DAVID AI: LLM Wiki Knowledge Architecture

This schema transforms DAVID from a standard chatbot into a maintaining agent for a compounding knowledge graph. It defines how he reads unstructured data, maintains entity relations, and natively expands his intelligence natively inside Supabase Postgres via the `david_wiki_*` schema.

## Core Database Tables (Deployed)
*   **`david_wiki_sources`**: The immutable bucket for your raw PDFs, procedures, and manuals.
*   **`david_wiki_pages`**: The markdown entries synthesized by DAVID, maintaining his core memory on specific topics (e.g., `alta-bates-ifus`). Equipped with `pgvector` for semantic context injection.
*   **`david_wiki_index`**: The centralized map of the brain. DAVID reads this first to understand the shape of his knowledge.
*   **`david_wiki_logs`**: Chronological trails of when DAVID ingested sources and updated pages.

## The Operational Workflow (To Be Built)
1.  **Ingestion:** The Master Admin drops a new PDF policy into the UI.
2.  **Synthesis:** DAVID triggers a background task (`delegate_task`). He reads the policy, creates a `david_wiki_pages` entry called `SIPS_HR_Protocol_v3`, tags it securely, and updates the `david_wiki_index`.
3.  **Cross-Referencing:** DAVID cross-references the new policy against older policies. If there is a contradiction, he logs it in the wiki page.
4.  **Retrieval:** When asked a question, DAVID runs an SQL vector search over `david_wiki_pages` to load the exact, pre-computed synthesis directly into his context window, guaranteeing zero hallucinations and instantaneous speed.

## Maintenance Requirements
DAVID will require a **Linter Hook**. Periodically (e.g., weekly), an async sweep will check his `david_wiki_pages` for orphan entries, contradicting data, or massive gaps, and alert you.
