"""
DUPLICATE DETECTION SERVICE

This service attempts to detect whether a complaint is likely
a duplicate of an existing one. For the MVP we return a safe
placeholder result so the pipeline works without needing
embeddings or a vector database yet.

Later, this module can be upgraded to use sentence embeddings
(e.g., sentence-transformers) and similarity search without
changing the API layer.
"""


def find_possible_duplicate(text: str) -> dict:
    """
    Placeholder duplicate detection.

    Returns:
        duplicate_of: ID of the similar complaint (None for now)
        similarity_score: similarity score between complaints
    """

    # MVP behavior: assume no duplicate
    return {
        "duplicate_of": None,
        "similarity_score": 0.0
    }