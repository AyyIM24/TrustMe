from datetime import datetime, timezone
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.auth import Token, LoginRequest, RegisterRequest, RefreshRequest, UserProfile
from services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, get_current_user
)

class FaceLoginRequest(BaseModel):
    username: str
    face_data: str

def verify_face_similarity(face1_b64: str, face2_b64: str) -> float:
    try:
        if "," in face1_b64:
            face1_b64 = face1_b64.split(",")[1]
        if "," in face2_b64:
            face2_b64 = face2_b64.split(",")[1]
            
        img1 = Image.open(BytesIO(base64.b64decode(face1_b64))).convert("L").resize((64, 64))
        img2 = Image.open(BytesIO(base64.b64decode(face2_b64))).convert("L").resize((64, 64))
        
        arr1 = np.array(img1, dtype=np.float32)
        arr2 = np.array(img2, dtype=np.float32)
        
        # Normalize to resist illumination variances
        arr1 = (arr1 - arr1.mean()) / (arr1.std() + 1e-5)
        arr2 = (arr2 - arr2.mean()) / (arr2.std() + 1e-5)
        
        # Calculate Cosine Similarity of normalized flat arrays
        cosine = np.dot(arr1.flatten(), arr2.flatten()) / (np.linalg.norm(arr1) * np.linalg.norm(arr2) + 1e-5)
        
        # Scale to [0, 1] range
        similarity = (cosine + 1.0) / 2.0
        return float(similarity)
    except Exception as e:
        print(f"Error in face verification: {e}")
        return 0.0

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account and return JWT tokens."""
    # Check if username exists
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if email exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        face_data=payload.face_data,
        last_login=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    token_data = {"sub": str(user.id), "username": user.username}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = db.query(User).filter(User.username == payload.username).first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token_data = {"sub": str(user.id), "username": user.username}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token."""
    token_data = decode_token(payload.refresh_token)
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    new_token_data = {"sub": str(user.id), "username": user.username}
    return Token(
        access_token=create_access_token(new_token_data),
        refresh_token=create_refresh_token(new_token_data)
    )


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's profile."""
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role or "user",
        has_face_data=bool(current_user.face_data),
        created_at=str(current_user.created_at),
        last_login=str(current_user.last_login) if current_user.last_login else None
    )


@router.put("/profile/face")
async def update_face_data(
    face_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the user's face registration data."""
    current_user.face_data = face_data.get("face_data")
    db.commit()
    return {"message": "Face data updated successfully"}


@router.put("/profile/password")
async def change_password(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change the current user's password."""
    old_password = payload.get("old_password", "")
    new_password = payload.get("new_password", "")

    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )

    current_user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/check-face")
async def check_face(username: str, db: Session = Depends(get_db)):
    """Check if the user has a registered Face ID."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"has_face": False}
    return {"has_face": bool(user.face_data)}


@router.post("/login-face", response_model=Token)
async def login_face(payload: FaceLoginRequest, db: Session = Depends(get_db)):
    """Login using biometric Face ID verification."""
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if not user.face_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face login is not set up for this user"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    similarity = verify_face_similarity(user.face_data, payload.face_data)
    if similarity < 0.65:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Biometric signature mismatch (similarity: {similarity:.2f})"
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token_data = {"sub": str(user.id), "username": user.username}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )
