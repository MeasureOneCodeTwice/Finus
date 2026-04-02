from typing import Optional
from fastapi import HTTPException, Header
import mysql.connector
import os
import jwt
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv('JWT_SECRET')
ALGORITHM = 'HS256'

def get_db_connection(timeout: int = 10):
    #check env vars
    if not all([os.getenv("MYSQL_HOST"), os.getenv("MYSQL_USER"), os.getenv("MYSQL_PASSWORD"), os.getenv("DB_NAME")]):
        raise HTTPException(status_code=500, detail="Missing environment variables")
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("DB_NAME"),
        connection_timeout=timeout
    )

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        
        return int(user_id)

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))#general exception for simpler unit
