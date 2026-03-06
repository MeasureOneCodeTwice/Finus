import pytest
from unittest.mock import patch, MagicMock
import mysql.connector
from src.dependencies import get_db_connection, get_current_user
from fastapi import HTTPException
import os
import jwt
from jwt import InvalidSignatureError

class TestDatabaseConnection:
    
    @patch('mysql.connector.connect')
    def test_get_db_connection_success(self, mock_connect, mock_env_vars):
        mock_connection = MagicMock()
        mock_connect.return_value = mock_connection
 
        result = get_db_connection()

        mock_connect.assert_called_once_with(
            host='localhost',
            user='test_user',
            password='test_password',
            database='test_db'
        )

        assert result == mock_connection
    
    @patch('mysql.connector.connect')
    def test_get_db_connection_missing_env_vars(self, mock_connect):
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(HTTPException):
                get_db_connection()
    
    @patch('mysql.connector.connect')
    def test_get_db_connection_failure(self, mock_connect):
        mock_connect.side_effect = mysql.connector.Error("Connection failed")
        with patch.dict(os.environ, {'MYSQL_HOST': 'localhost', 'MYSQL_USER': 'test_user', 'MYSQL_PASSWORD': 'test_password', 'DB_NAME': 'test_db'}, clear=True):
            with pytest.raises(mysql.connector.Error):
                get_db_connection()



class TestJWTAuthentication:
    
    @pytest.mark.asyncio
    async def test_get_current_user_missing_user_id(self):
        payload = {'email': 'test@example.com'} 
        
        token = jwt.encode(payload, 'test_secret_key_12345', algorithm='HS256')
        
        with patch.dict(os.environ, {'JWT_SECRET': 'test_secret_key_12345'}):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=f"Bearer {token}")
            
            assert exc_info.value.status_code == 401
            assert exc_info.value.detail == "Invalid token"
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_signature(self):
        payload = {'sub': '123'}
        token = jwt.encode(payload, 'wrong_secret', algorithm='HS256')
        
        with patch.dict(os.environ, {'JWT_SECRET': 'test_secret_key_12345'}):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=f"Bearer {token}")
            
            assert exc_info.value.status_code == 401
            assert "signature" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()