from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from .core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class App(Base):
    __tablename__ = "apps"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    icon_url = Column(String)
    link_url = Column(String)
    description = Column(Text)

class LineBotConfig(Base):
    __tablename__ = "linebot_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # 辨識名稱，例如: "主要通知機器人"
    channel_access_token = Column(String)  # LINE Channel Access Token
    channel_secret = Column(String)  # LINE Channel Secret
    user_id = Column(String)  # 接收通知的 User ID 或 Group ID
    enabled = Column(Boolean, default=True)  # 是否啟用
    description = Column(Text, nullable=True)  # 描述
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
