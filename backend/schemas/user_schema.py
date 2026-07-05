from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, description="User's full name")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    department: str = Field(..., description="Academic department")
    graduation_year: int = Field(..., gt=1900, lt=2100, description="4-digit graduation year")

class UserLogin(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    graduation_year: int
    department: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    # Pydantic v2 syntax for ORM mapping
    model_config = ConfigDict(from_attributes=True)