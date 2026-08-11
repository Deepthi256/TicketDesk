from fastapi import HTTPException

ALLOWED_STATUS = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED"
]


def validate_status_change(current: str, new: str):
    order = {
        "OPEN": 0,
        "IN_PROGRESS": 1,
        "RESOLVED": 2,
        "CLOSED": 3
    }

    if new not in order:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    if current not in order:
        raise HTTPException(
            status_code=400,
            detail="Current status invalid"
        )

    if order[new] != order[current] + 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid status workflow"
        )

    return True