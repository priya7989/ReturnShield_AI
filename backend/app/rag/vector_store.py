import os
import logging
from typing import Optional, Any
import chromadb
from chromadb.config import Settings

from app.rag.document_loader import load_and_split_policy_documents
from app.rag.embeddings import get_embedding_function

logger = logging.getLogger("returnshield.rag.vector_store")

# Persist vector database in backend/chroma_db
CHROMA_DB_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "chroma_db"
)

COLLECTION_NAME = "return_policy"

_chroma_client: Optional[Any] = None
_policy_collection: Optional[Any] = None


def initialize_vector_store() -> Any:
    """
    Initialize persistent ChromaDB client and retrieve or create the return_policy collection.
    """
    global _chroma_client, _policy_collection

    if _policy_collection is not None:
        return _policy_collection

    try:
        os.makedirs(CHROMA_DB_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

        embedding_fn = get_embedding_function()

        if embedding_fn:
            _policy_collection = _chroma_client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=embedding_fn,
                metadata={"hnsw:space": "cosine"}
            )
        else:
            _policy_collection = _chroma_client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )

        logger.info(f"[RAG VECTOR STORE] Initialized ChromaDB collection '{COLLECTION_NAME}' at {CHROMA_DB_DIR}")
        return _policy_collection

    except Exception as e:
        logger.error(f"[RAG VECTOR STORE] Failed to initialize ChromaDB: {e}")
        return None


def index_policy_documents(force: bool = False) -> int:
    """
    Load return_policy.md chunks and index them into ChromaDB.
    Skips re-indexing if documents are already present unless force=True.
    """
    collection = initialize_vector_store()
    if not collection:
        logger.warning("[RAG VECTOR STORE] Cannot index documents — collection unavailable.")
        return 0

    current_count = collection.count()
    if current_count > 0 and not force:
        logger.info(f"[RAG VECTOR STORE] Policy collection already indexed ({current_count} chunks). Skipping re-indexing.")
        return current_count

    if force and current_count > 0:
        logger.info("[RAG VECTOR STORE] Force re-indexing requested. Clearing existing collection chunks...")
        # Re-initialize collection
        all_ids = collection.get()["ids"]
        if all_ids:
            collection.delete(ids=all_ids)

    chunks = load_and_split_policy_documents()
    if not chunks:
        logger.warning("[RAG VECTOR STORE] No policy chunks loaded.")
        return 0

    ids = [chunk["metadata"]["chunk_id"] for chunk in chunks]
    documents = [chunk["content"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    new_count = collection.count()
    logger.info(f"[RAG VECTOR STORE] Successfully indexed {len(chunks)} policy chunks into ChromaDB collection. Total count: {new_count}")
    return new_count


def get_vector_store() -> Any:
    """
    Returns the active policy ChromaDB collection.
    """
    return initialize_vector_store()
