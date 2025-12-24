from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ...schemas.linebot import LineBotConfig, LineBotConfigCreate, LineBotConfigUpdate, LineBotTestMessage
from ...services import linebot as linebot_service
from ...services.auth import get_current_user
from ...core.database import get_db

router = APIRouter()

@router.get("/linebot-configs", response_model=List[LineBotConfig])
async def get_linebot_configs(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取得所有 LINE Bot 設定"""
    return linebot_service.get_all_linebot_configs(db)

@router.get("/linebot-configs/{config_id}", response_model=LineBotConfig)
async def get_linebot_config(
    config_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取得單一 LINE Bot 設定"""
    config = linebot_service.get_linebot_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LINE Bot 設定不存在")
    return config

@router.post("/linebot-configs", response_model=LineBotConfig)
async def create_linebot_config(
    config_in: LineBotConfigCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """建立新的 LINE Bot 設定"""
    return linebot_service.create_linebot_config(db, config_in)

@router.put("/linebot-configs/{config_id}", response_model=LineBotConfig)
async def update_linebot_config(
    config_id: int,
    config_update: LineBotConfigUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新 LINE Bot 設定"""
    updated_config = linebot_service.update_linebot_config(db, config_id, config_update)
    if not updated_config:
        raise HTTPException(status_code=404, detail="LINE Bot 設定不存在")
    return updated_config

@router.delete("/linebot-configs/{config_id}")
async def delete_linebot_config(
    config_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """刪除 LINE Bot 設定"""
    success = linebot_service.delete_linebot_config(db, config_id)
    if not success:
        raise HTTPException(status_code=404, detail="LINE Bot 設定不存在")
    return {"status": "success", "message": "LINE Bot 設定已刪除"}

@router.post("/linebot-configs/{config_id}/test")
async def test_linebot_config(
    config_id: int,
    test_message: LineBotTestMessage = LineBotTestMessage(),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """測試 LINE Bot 設定，發送測試訊息"""
    result = await linebot_service.test_linebot_config(db, config_id, test_message.message)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/linebot-configs/broadcast")
async def broadcast_notification(
    test_message: LineBotTestMessage,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """向所有啟用的 LINE Bot 發送通知"""
    results = await linebot_service.broadcast_notification(db, test_message.message)
    return {
        "status": "completed",
        "results": results,
        "total": len(results),
        "successful": sum(1 for r in results if r["success"])
    }
