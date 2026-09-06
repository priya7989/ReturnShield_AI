from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.rag import index_policy_documents, retrieve_policy_context

router = APIRouter(prefix="/api/rag", tags=["RAG Policy Vector Store"])

@router.post("/reindex")
def reindex_policy_vector_store():
    """
    Development endpoint to force re-indexing return_policy.md into ChromaDB.
    """
    try:
        count = index_policy_documents(force=True)
        return {
            "status": "success",
            "message": f"Successfully re-indexed return_policy.md into ChromaDB vector store.",
            "indexed_chunks_count": count
        }
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-indexing failed: {str(err)}"
        )


@router.get("/policy")
def query_policy_rag(query: str, top_k: Optional[int] = 4):
    """
    Debug endpoint to perform semantic RAG search against ChromaDB policy collection.
    """
    if not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty."
        )

    retrieved = retrieve_policy_context(query, top_k=top_k or 4)
    return {
        "query": query,
        "retrieved_count": len(retrieved),
        "results": retrieved
    }
