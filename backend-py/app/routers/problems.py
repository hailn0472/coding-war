"""
Problems Router — Fully Implemented
Equivalent to: backend/src/routes/problem.routes.ts
6 endpoints: list, get, create, update, delete, upload-test-cases
"""

import io
import zipfile

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, get_current_user, get_optional_user
from app.dependencies.authorize import require_admin
from app.dependencies.database import get_db
from app.middleware.error_handler import AppError
from app.schemas.problem import (
    CreateProblemRequest,
    ProblemListResponse,
    ProblemResponse,
    UpdateProblemRequest,
)
from app.services.problem_service import (
    create_problem,
    delete_problem,
    get_problem_by_id,
    list_problems,
    update_problem,
)
from app.services.test_case_service import process_testcase_zip
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("problems_router")


def _to_response(p) -> dict:
    return {
        "id": str(p.id),
        "title": p.title,
        "slug": p.slug,
        "description": p.description,
        "difficulty": p.difficulty.value,
        "time_limit": p.time_limit,
        "memory_limit": p.memory_limit,
        "tags": p.tags or [],
        "visibility": p.visibility.value,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@router.get("/")
async def list_problems_endpoint(
    page: int = 1,
    limit: int = 20,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_user),
):
    """List problems with filtering and pagination."""
    is_admin = user and user.role == "ADMIN"
    result = await list_problems(
        db,
        page=page,
        limit=limit,
        difficulty=difficulty,
        visibility=None if is_admin else "PUBLIC",
    )
    return {
        "problems": [_to_response(p) for p in result["problems"]],
        "total": result["total"],
        "page": result["page"],
        "totalPages": result["total_pages"],
    }


@router.get("/{problem_id}")
async def get_problem_endpoint(
    problem_id: str,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_user),
):
    """Get problem details."""
    problem = await get_problem_by_id(db, problem_id)
    return _to_response(problem)


@router.post("/", status_code=201)
async def create_problem_endpoint(
    data: CreateProblemRequest,
    db: AsyncSession = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    """Create problem (Admin only)."""
    problem = await create_problem(
        db,
        title=data.title,
        description=data.description,
        difficulty=data.difficulty,
        time_limit=data.time_limit,
        memory_limit=data.memory_limit,
        tags=data.tags,
        visibility=data.visibility,
    )
    return _to_response(problem)


@router.put("/{problem_id}")
async def update_problem_endpoint(
    problem_id: str,
    data: UpdateProblemRequest,
    db: AsyncSession = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    """Update problem (Admin only)."""
    update_data = data.model_dump(exclude_none=True)
    problem = await update_problem(db, problem_id, **update_data)
    return _to_response(problem)


@router.delete("/{problem_id}", status_code=204)
async def delete_problem_endpoint(
    problem_id: str,
    db: AsyncSession = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    """Delete problem (Admin only)."""
    await delete_problem(db, problem_id)
    return None


@router.post("/{problem_id}/test-cases", status_code=201)
async def upload_test_cases_endpoint(
    problem_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: CurrentUser = Depends(require_admin),
):
    """Upload test cases zip (Admin only)."""
    # Validate problem exists
    problem = await get_problem_by_id(db, problem_id)

    # Read zip file
    content = await file.read()
    if not content:
        raise AppError(400, "EMPTY_FILE", "Uploaded file is empty")

    try:
        zip_buffer = io.BytesIO(content)
        zip_file = zipfile.ZipFile(zip_buffer)
    except zipfile.BadZipFile:
        raise AppError(400, "INVALID_ZIP", "Uploaded file is not a valid zip")

    count = await process_testcase_zip(db, str(problem.id), zip_file)
    return {"message": f"Uploaded {count} test cases", "count": count}
