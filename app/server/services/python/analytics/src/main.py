from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import List
import uvicorn
import os


from src.dependencies import get_db_connection, get_current_user
from src.utils.dates import period_calc
from src.logic.budget import generate_budget, generate_budget_performance
from src.queries import savings as savings_queries, incomeflow as incomeflow_queries
from src.logic import savings as savings_service, incomeflow as incomeflow_service, debt as debt_service
from src.models.schemas import (
    BadRequestError,
    ProjectedSavingsRequest,
    CompoundInterestResponse,
    DebtPayoffRequest
)


app = FastAPI()

# CORS setup
origins = [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
        "http://18.190.215.135", #prod webserver
        "http://3.142.125.202",  #dev webserver
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/charts/savings')
async def get_savings(period: str, user_id: int = Depends(get_current_user)):
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")

        cursor = connection.cursor(dictionary=True)

        # Get savings accounts
        accounts = savings_queries.get_savings_accounts(cursor, user_id)
        if not accounts:
            cursor.close()
            connection.close()
            return None

        # Get transactions
        account_ids = [acc['id'] for acc in accounts]
        transactions = savings_queries.get_savings_transactions(cursor, account_ids)

        cursor.close()
        connection.close()

        if not transactions:
            return None

        # Calculate date range
        end_date = pd.Timestamp.today()
        start_date, _, _, period_name = period_calc(period, end_date)

        # Process data
        result = savings_service.calculate_savings_over_time(
            accounts, transactions, start_date, end_date, period, period_name
        )

        return result

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")


@app.get('/charts/incomeflow')
async def get_income_flow(
    period: str = Query(default='w', enum=['w', 'm', 'y']),
    user_id: int = Depends(get_current_user)
):
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")

        cursor = connection.cursor(dictionary=True)

        # Calculate date range
        end_date = pd.Timestamp.today()
        start_date, _, _, _ = period_calc(period, end_date)

        # Get transactions
        transactions = incomeflow_queries.get_user_transactions(cursor, user_id, start_date, end_date)

        cursor.close()
        connection.close()

        if not transactions:
            return None

        # Build sankey data
        return incomeflow_service.build_sankey_data(transactions)

    except Exception as e:
        print(f"Error generating income flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating income flow: {str(e)}")


@app.get('/charts/budget-expenditure')
async def get_budget(
    period: str = Query(default='w', enum=['w', 'm', 'y']),
    user_id: int = Depends(get_current_user)
):
    try:
        print(f"Generating budget for user {user_id} with period {period}")
        budget = generate_budget(period, user_id)
        performance = await generate_budget_performance(user_id, budget, period)
        print(f'generated performance: {performance}')
        return performance
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/predict-debt-payoff')
async def predict_debt_payoff(
    requestBody: DebtPayoffRequest,
    user_id: int = Depends(get_current_user),
):
    try:
        print(f"Generating predicted debt payoff for user {user_id}")
        print(requestBody)
        return debt_service.generate_debt_payoff_stages(requestBody)
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/compound-interest')
async def compound_interest(
    requestBody: ProjectedSavingsRequest,
    user_id: int = Depends(get_current_user),
) -> List[CompoundInterestResponse]:
    try:
        print(f"Generating compound interests for user {user_id}")
        print(requestBody)
        return savings_service.calculate_compound_interest(requestBody)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/health', response_class=PlainTextResponse)
async def health():
    status = 'ok'
    try:
        conn = get_db_connection(1)
        conn.close()
    except Exception:
        status = 'unhealthy'

    return status

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
