from fastapi import APIRouter

from app.services.iol import login_iol


router = APIRouter(prefix="/iol", tags=["iol"])


@router.post("/login")
def iol_login(username: str, password: str):
    return login_iol(username, password)
    