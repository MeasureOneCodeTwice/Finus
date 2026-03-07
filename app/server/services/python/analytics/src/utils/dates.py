import pandas as pd
from typing import Tuple

def period_calc(period: str, end_date: pd.Timestamp) -> Tuple[pd.Timestamp, str, str, str]:
    """Calculate date range based on period"""
    if period == 'w':
        start_date = end_date - pd.Timedelta(days=7)
        freq = 'D'
        date_format = '%Y-%m-%d'
        period_name = 'Weekly'
    elif period == 'm':
        start_date = end_date - pd.Timedelta(days=30)
        freq = 'D'
        date_format = '%Y-%m-%d'
        period_name = 'Monthly'
    else:  # 'y'
        start_date = end_date - pd.Timedelta(days=365)
        freq = 'M'
        date_format = '%Y-%m'
        period_name = 'Yearly'
    
    return start_date, freq, date_format, period_name