import pandas as pd
import math
from typing import List, Dict
from src.models.schemas import DebtPayoffRequest, DebtPayoffResponse, DebtStage

def calculateExpectedPayOffDate(dbr: DebtPayoffRequest) -> DebtPayoffResponse:
    numOfInstallments = math.floor(dbr.remainingAmount / dbr.minimumPayment)
    debtStages: List[DebtStage] = []

    for i in range(numOfInstallments):
        expectedDate = pd.to_datetime(dbr.nextDueDate) + pd.Timedelta(days=dbr.period * i)
        if (i + 1 == numOfInstallments):
            paidAmountPerStage = dbr.minimumPayment + (dbr.remainingAmount % (dbr.minimumPayment * (i + 1)))
            remainingAmount = 0
        else:
            paidAmountPerStage = dbr.minimumPayment
            remainingAmount = dbr.remainingAmount - (paidAmountPerStage * (i + 1))

        debtStages.append(DebtStage(
            paidAmount=paidAmountPerStage,
            remainingDebt=remainingAmount,
            installmentDate=expectedDate.strftime('%Y-%m-%d')
        ))

    return {
        "id": dbr.id,
        "category": dbr.category,
        "minimumPayment": dbr.minimumPayment,
        "debtStages": debtStages
    }
