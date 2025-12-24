from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LineBotConfigBase(BaseModel):
    name: str
    channel_access_token: str
    channel_secret: str
    user_id: str
    enabled: bool = True
    description: Optional[str] = None

class LineBotConfigCreate(LineBotConfigBase):
    pass

class LineBotConfigUpdate(BaseModel):
    name: Optional[str] = None
    channel_access_token: Optional[str] = None
    channel_secret: Optional[str] = None
    user_id: Optional[str] = None
    enabled: Optional[bool] = None
    description: Optional[str] = None

class LineBotConfig(LineBotConfigBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LineBotTestMessage(BaseModel):
    message: str = "這是一則測試通知訊息 🔔"
