from typing import Optional
from fastapi import HTTPException, Header
import mysql.connector
import os
import jwt
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv('JWT_SECRET')
ALGORITHM = 'HS256'

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub') or payload.get('user_id') or payload.get('id')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return int(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")