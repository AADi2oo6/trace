"""TRACE Artifact Streaming & Download Endpoints."""

from fastapi import APIRouter, HTTPException, Response, status

from app.services.artifact_service import artifact_service

router = APIRouter(prefix="/artifacts", tags=["Artifacts"])


@router.get(
    "/{artifact_id}/download",
    summary="Download Original Artifact",
    description="Stream the original response payload file with sanitized Content-Disposition attachment header.",
)
async def download_artifact(artifact_id: str) -> Response:
    """Stream stored response artifact for direct file download."""
    result = artifact_service.get_artifact(artifact_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {artifact_id} was not found or has expired.",
        )

    raw_bytes, record = result
    safe_filename = record.filename.replace('"', '\\"')

    return Response(
        content=raw_bytes,
        media_type=record.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Length": str(len(raw_bytes)),
            "Cache-Control": "private, max-age=3600",
        },
    )


@router.get(
    "/{artifact_id}/raw",
    summary="Stream Raw Artifact for Preview",
    description="Stream raw response payload bytes with original media Content-Type for media players, images, or documents.",
)
async def get_raw_artifact(artifact_id: str) -> Response:
    """Stream raw response artifact with original Content-Type for in-browser preview."""
    result = artifact_service.get_artifact(artifact_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {artifact_id} was not found or has expired.",
        )

    raw_bytes, record = result

    # Security headers to prevent MIME sniffing or dangerous script execution in TRACE context
    headers = {
        "Content-Length": str(len(raw_bytes)),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
    }

    return Response(
        content=raw_bytes,
        media_type=record.content_type or "application/octet-stream",
        headers=headers,
    )


@router.get(
    "/{artifact_id}/zip",
    summary="Download Complete Artifact ZIP Archive",
    description="Stream an all-in-one ZIP archive containing the original payload, headers, execution details, and README.",
)
async def download_artifact_zip(artifact_id: str) -> Response:
    """Generate and stream secure ZIP export archive for the artifact."""
    zip_result = artifact_service.create_zip_archive(artifact_id)
    if not zip_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {artifact_id} was not found or has expired.",
        )

    zip_bytes, zip_filename = zip_result

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
            "Content-Length": str(len(zip_bytes)),
            "Cache-Control": "no-cache",
        },
    )
