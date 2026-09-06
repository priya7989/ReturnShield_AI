import os
import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger("returnshield.rag.loader")

POLICY_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "knowledge",
    "return_policy.md"
)

def load_and_split_policy_documents() -> List[Dict[str, Any]]:
    """
    Reads backend/app/knowledge/return_policy.md, parses header sections,
    and splits the return policy into meaningful text chunks with structured metadata.
    """
    if not os.path.exists(POLICY_FILE_PATH):
        logger.error(f"[RAG LOADER] Policy file not found at {POLICY_FILE_PATH}")
        return []

    with open(POLICY_FILE_PATH, "r", encoding="utf-8") as f:
        full_text = f.read()

    # Split document by markdown section headers (## or ###)
    sections = re.split(r'\n(?=##?\s+)', full_text)
    chunks = []

    for idx, sec in enumerate(sections):
        sec_trimmed = sec.strip()
        if not sec_trimmed:
            continue

        # Extract section title from first header line
        lines = sec_trimmed.split("\n")
        first_line = lines[0]
        section_title = re.sub(r'^#+\s*', '', first_line).strip() or "general_policy"
        section_slug = section_title.lower().replace(" ", "_").replace("&", "and")

        chunk_data = {
            "content": sec_trimmed,
            "metadata": {
                "source": "return_policy.md",
                "document_type": "return_policy",
                "section": section_slug,
                "section_title": section_title,
                "chunk_id": f"policy_chunk_{idx + 1}"
            }
        }
        chunks.append(chunk_data)

    logger.info(f"[RAG LOADER] Parsed {len(chunks)} policy document chunks from return_policy.md")
    return chunks
