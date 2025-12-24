from sqlalchemy.orm import Session
from ..models import LineBotConfig
from ..schemas.linebot import LineBotConfigCreate, LineBotConfigUpdate
import httpx

def get_all_linebot_configs(db: Session):
    """取得所有 LINE Bot 設定"""
    return db.query(LineBotConfig).all()

def get_linebot_config(db: Session, config_id: int):
    """取得單一 LINE Bot 設定"""
    return db.query(LineBotConfig).filter(LineBotConfig.id == config_id).first()

def get_enabled_linebot_configs(db: Session):
    """取得所有啟用的 LINE Bot 設定"""
    return db.query(LineBotConfig).filter(LineBotConfig.enabled == True).all()

def create_linebot_config(db: Session, config_in: LineBotConfigCreate):
    """建立新的 LINE Bot 設定"""
    db_config = LineBotConfig(**config_in.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

def update_linebot_config(db: Session, config_id: int, config_update: LineBotConfigUpdate):
    """更新 LINE Bot 設定"""
    db_config = db.query(LineBotConfig).filter(LineBotConfig.id == config_id).first()
    if not db_config:
        return None
    
    update_data = config_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_config, key, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config

def delete_linebot_config(db: Session, config_id: int):
    """刪除 LINE Bot 設定"""
    db_config = db.query(LineBotConfig).filter(LineBotConfig.id == config_id).first()
    if db_config:
        db.delete(db_config)
        db.commit()
        return True
    return False

async def send_line_message(channel_access_token: str, user_id: str, message: str) -> dict:
    """
    發送 LINE 訊息
    
    Args:
        channel_access_token: LINE Channel Access Token
        user_id: 接收者的 User ID 或 Group ID
        message: 要發送的訊息內容
    
    Returns:
        dict: 包含成功狀態和訊息的字典
    """
    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {channel_access_token}"
    }
    payload = {
        "to": user_id,
        "messages": [
            {
                "type": "text",
                "text": message
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                return {"success": True, "message": "訊息發送成功"}
            else:
                error_detail = response.json() if response.text else {"error": "Unknown error"}
                return {"success": False, "message": f"發送失敗: {error_detail}"}
    except Exception as e:
        return {"success": False, "message": f"發送失敗: {str(e)}"}

async def test_linebot_config(db: Session, config_id: int, message: str) -> dict:
    """
    測試 LINE Bot 設定
    
    Args:
        db: 資料庫 session
        config_id: LINE Bot 設定 ID
        message: 測試訊息內容
    
    Returns:
        dict: 包含測試結果的字典
    """
    config = get_linebot_config(db, config_id)
    if not config:
        return {"success": False, "message": "找不到指定的 LINE Bot 設定"}
    
    return await send_line_message(
        channel_access_token=config.channel_access_token,
        user_id=config.user_id,
        message=message
    )

async def broadcast_notification(db: Session, message: str) -> list:
    """
    向所有啟用的 LINE Bot 發送通知
    
    Args:
        db: 資料庫 session
        message: 通知訊息內容
    
    Returns:
        list: 各個 LINE Bot 的發送結果
    """
    configs = get_enabled_linebot_configs(db)
    results = []
    
    for config in configs:
        result = await send_line_message(
            channel_access_token=config.channel_access_token,
            user_id=config.user_id,
            message=message
        )
        results.append({
            "config_id": config.id,
            "config_name": config.name,
            **result
        })
    
    return results
