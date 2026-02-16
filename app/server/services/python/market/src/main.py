from fastapi import FastAPI, HTTPException
import uvicorn
import os

app = FastAPI()

@app.get('/health')
def test_endpoint():
    return 'ok'

if __name__ == "__main__":
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
