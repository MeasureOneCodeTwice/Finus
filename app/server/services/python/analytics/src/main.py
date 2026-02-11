from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import uvicorn
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# test endpoint
@app.get('/health')
def test_endpoint():
    return 'ok'



if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
