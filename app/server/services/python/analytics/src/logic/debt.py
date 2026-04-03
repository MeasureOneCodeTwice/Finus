import pandas as pd
from typing import List, Optional
from datetime import datetime, timedelta
from src.models.schemas import DebtPayoffRequest, DebtPayoffResponse, DebtPayoffStage, BadRequestError


def generate_debt_payoff_stages(dbr: DebtPayoffRequest) -> DebtPayoffResponse:
    remaining_debt = dbr.remainingAmount
    minimum_payment = dbr.minimumPayment
    interest_rate = dbr.interestRate or 0

    monthly_interest_rate = round(interest_rate / 12 / 100, 4) if interest_rate else 0

    expected_date = datetime.strptime(dbr.nextDueDate, "%Y-%m-%d")
    stages: List[DebtPayoffStage] = []

    i = 1
    while remaining_debt > 0:
        interest = remaining_debt * monthly_interest_rate
        principal = minimum_payment - interest

        if principal > remaining_debt:
            principal = remaining_debt

        if principal <= 0:
            raise BadRequestError("Minimum payment is too low. Debt will never be paid off.")

        new_remaining = remaining_debt - principal

        stages.append(DebtPayoffStage(
            id=i,
            principalAmount=round(principal, 2),
            interestAmount=round(interest, 2),
            remainingDebt=round(new_remaining, 2),
            installmentDate=expected_date.strftime("%Y-%m-%d")
        ))

        remaining_debt = new_remaining
        expected_date += timedelta(days=dbr.period)
        i += 1

    return DebtPayoffResponse(
        id=dbr.id,
        category=dbr.category,
        minimumPayment=dbr.minimumPayment,
        interestRate=interest_rate,
        debtStages=stages,
    )
