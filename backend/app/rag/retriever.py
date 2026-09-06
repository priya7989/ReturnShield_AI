import logging
from typing import List, Dict, Any
from app.rag.vector_store import get_vector_store, index_policy_documents

logger = logging.getLogger("returnshield.rag.retriever")

def retrieve_policy_context(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Queries ChromaDB vector collection using semantic similarity.
    Returns top_k relevant policy chunks with content, metadata, and distance scores.
    """
    logger.info(f"[RAG RETRIEVER] Querying policy vector store for: '{query}'")

    collection = get_vector_store()

    # Auto-index if collection is empty
    if not collection or collection.count() == 0:
        logger.info("[RAG RETRIEVER] Vector store empty on query attempt. Auto-indexing return_policy.md...")
        index_policy_documents()
        collection = get_vector_store()

    if not collection or collection.count() == 0:
        logger.warning("[RAG RETRIEVER] Vector store unavailable or empty. Returning fallback policy context.")
        return [
            {
                "content": "Standard 14-day return policy for sealed items; 7-day policy for damaged goods.",
                "metadata": {"source": "fallback", "section": "general_policy"},
                "distance": 0.5
            }
        ]

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(top_k, collection.count())
        )

        retrieved_chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            dists = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metas, dists):
                retrieved_chunks.append({
                    "content": doc,
                    "metadata": meta,
                    "distance": round(float(dist), 4) if dist is not None else 0.0
                })

        logger.info(f"[RAG RETRIEVER] Retrieved {len(retrieved_chunks)} policy chunks for query '{query}'")
        return retrieved_chunks

    except Exception as e:
        logger.error(f"[RAG RETRIEVER] Error querying ChromaDB: {e}")
        return [
            {
                "content": "Policy retrieval error fallback: Damaged products eligible within 7 days; Defective items within 30 days.",
                "metadata": {"source": "error_fallback", "section": "error"},
                "distance": 1.0
            }
        ]
