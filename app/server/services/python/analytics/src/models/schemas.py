from numpy import number
from pydantic import BaseModel
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
    id: number
    category: str
    minimumPayment: float
    remainingAmount: float
    nextDueDate: str
    period: number  # in days
class DebtStage(BaseModel):
    paidAmount: float
    remainingDebt: float
    installmentDate: str
class DebtPayoffResponse(BaseModel):
    id: number
    category: str
    minimumPayment: float
    debtStages: List[DebtStage]
class ProjectedSavingsRequest(BaseModel):
    balance: float
    monthly_contribution: float
    interest_rate: float | None  # annual interest rate in percentage
    time_frame: int  # in years
class StatItem(BaseModel):
    year: int
    best_case: float
    projected_balance: float
    worst_case: float
class ProjectedSavingsResponse(BaseModel):
    balance: float
    monthly_contribution: float
    interest_rate: float | None  # annual interest rate in percentage
    time_frame: int  # in years
    stat: List[StatItem]