import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve absolute path for persistence
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "apps.json")

class AppItem(BaseModel):
    id: int
    title: str
    icon_url: str
    link_url: str
    description: str

class AppUpdate(BaseModel):
    title: Optional[str] = None
    icon_url: Optional[str] = None
    link_url: Optional[str] = None
    description: Optional[str] = None

def load_apps():
    if not os.path.exists(DATA_FILE):
        default_apps = [
            {
                "id": 1,
                "title": "Dashboard",
                "icon_url": "https://ui-avatars.com/api/?name=DB&background=0D8ABC&color=fff&size=128",
                "link_url": "/dashboard",
                "description": "Main system dashboard"
            },
            {
                "id": 2,
                "title": "User Management",
                "icon_url": "https://ui-avatars.com/api/?name=UM&background=ff5252&color=fff&size=128",
                "link_url": "/users",
                "description": "Manage system users"
            },
            {
                "id": 3,
                "title": "Reports",
                "icon_url": "https://ui-avatars.com/api/?name=RP&background=4caf50&color=fff&size=128",
                "link_url": "/reports",
                "description": "View analytics and reports"
            },
            {
                "id": 4,
                "title": "Settings",
                "icon_url": "https://ui-avatars.com/api/?name=ST&background=607d8b&color=fff&size=128",
                "link_url": "/settings",
                "description": "System configuration"
            },
             {
                "id": 5,
                "title": "Help Center",
                "icon_url": "https://ui-avatars.com/api/?name=HC&background=ff9800&color=fff&size=128",
                "link_url": "/help",
                "description": "Documentation and support"
            },
        ]
        save_apps(default_apps)
        return default_apps
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_apps(apps):
    with open(DATA_FILE, "w") as f:
        json.dump(apps, f, indent=4)

@app.get("/api/apps", response_model=List[AppItem])
async def get_apps():
    """
    Returns a list of applications to display on the portal.
    """
    return load_apps()

@app.put("/api/apps/{app_id}", response_model=AppItem)
async def update_app(app_id: int, app_update: AppUpdate):
    apps = load_apps()
    for app in apps:
        if app["id"] == app_id:
            if app_update.title is not None:
                app["title"] = app_update.title
            if app_update.icon_url is not None:
                app["icon_url"] = app_update.icon_url
            if app_update.link_url is not None:
                app["link_url"] = app_update.link_url
            if app_update.description is not None:
                app["description"] = app_update.description
            
            save_apps(apps)
            return app
    raise HTTPException(status_code=404, detail="App not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
