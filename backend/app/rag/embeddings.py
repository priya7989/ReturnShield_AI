import logging
from typing import Any

logger = logging.getLogger("returnshield.rag.embeddings")

def get_embedding_function() -> Any:
    """
    Returns the configured embedding function for ChromaDB vector operations.
    Defaults to Chroma's built-in ONNX MiniLM-L6-v2 local model (zero external API key required).
    Modular design allows replacing with SentenceTransformers or OpenAI embeddings if configured.
    """
    try:
        import chromadb.utils.embedding_functions as ef
        # ChromaDB default local embedding function (all-MiniLM-L6-v2)
        embedding_fn = ef.DefaultEmbeddingFunction()
        logger.info("[RAG EMBEDDINGS] Initialized default local ChromaDB ONNX MiniLM embedding function")
        return embedding_fn
    except Exception as e:
        logger.warning(f"[RAG EMBEDDINGS] Could not initialize default Chroma embedding function: {e}")
        return None
