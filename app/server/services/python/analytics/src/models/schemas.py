from numpy import number
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime

class SavingsDataPoint(BaseModel):
    date: str
    savings: float

class SavingsChartResponse(BaseModel):
    labels: List[str]
    datasets: List[dict]

class SankeyNode(BaseModel):
    name: str

class SankeyLink(BaseModel):
    source: int
    target: int
    value: int

class SankeyResponse(BaseModel):
    nodes: List[SankeyNode]
    links: List[SankeyLink]

class Transaction(BaseModel):
    amount: float
    category: str
    date: datetime
    account_name: Optional[str] = None

class BudgetCategory(BaseModel):
    category: str
    type: Literal['need', 'want', 'savings']
    avg_monthly_spent: float
    monthly_budget: float
    recommended_budget: float
    is_essential: bool

class BudgetResponse(BaseModel):
    budget: List[BudgetCategory]
    generated_date: str

class BudgetPerformanceItem(BaseModel):
    category: str
    budget: float
    actual: float
    variance: float
    percent_used: float
    status: Literal['overspent', 'under_budget', 'on_track']

class BudgetPerformanceResponse(BaseModel):
    categories: List[str]
    budgetAmounts: List[float]
    actualAmounts: List[float]

class DebtPayoffRequest(BaseModel):
    id: str
    category: str
    remainingAmount: float
    minimumPayment: float = Field(..., gt=0, description="Minimum payment must be greater than 0")
    interestRate: Optional[float] = Field(default=0, description="Interest rate in percentage")
    nextDueDate: str  # YYYY-MM-DD
    period: int = Field(..., gt=0, description="Period must be greater than 0") # in days

class DebtPayoffStage(BaseModel):
    id: int
    principalAmount: float
    interestAmount: float
    remainingDebt: float
    installmentDate: str

class DebtPayoffResponse(BaseModel):
    id: str
    category: str
    minimumPayment: float
    interestRate: float
    debtStages: List[DebtPayoffStage]

class ProjectedSavingsRequest(BaseModel):
    financial_account_id: int
    balance: float
    monthly_deposit: float = Field(..., gt=0, description="Monthly deposit must be greater than 0")
    annual_interest_rate: Optional[float] = None  # annual interest rate in percentage
    time_frame: int = Field(..., gt=0, description="Time frame must be greater than 0") # in years
class MonthlySavingGrowthRate(BaseModel):
    best_case: float
    expected_case: float
    worst_case: float
class ProjectedSavingsResponse(BaseModel):
    balance: float
    monthly_contribution: float
    interest_rate: float | None  # annual interest rate in percentage
    time_frame: int  # in years
    stat: List[MonthlySavingGrowthRate]
class CompoundInterestResponse(BaseModel):
    accumulative_best_balance: float
    accumulative_expected_balance: float
    accumulative_worst_balance: float
    date: str

class BadRequestError(Exception):
    pass