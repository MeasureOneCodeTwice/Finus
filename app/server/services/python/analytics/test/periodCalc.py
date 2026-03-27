import pytest
import pandas as pd
from src.utils.dates import period_calc

class TestPeriodCalc:
    
    def test_period_calc_weekly(self):
        end_date = pd.Timestamp('2024-03-15')
        
        start_date, freq, date_format, period_name = period_calc('w', end_date)
        
        # Check start date is 7 days before end date
        expected_start = end_date - pd.Timedelta(days=7)
        assert start_date == expected_start
        assert start_date.strftime('%Y-%m-%d') == '2024-03-08'
        
        # Check other return values
        assert freq == 'D'
        assert date_format == '%Y-%m-%d'
        assert period_name == 'Weekly'
    
    def test_period_calc_monthly(self):
        end_date = pd.Timestamp('2024-03-15')
        
        start_date, freq, date_format, period_name = period_calc('m', end_date)
        
        # Check start date is 30 days before end date
        expected_start = end_date - pd.Timedelta(days=30)
        assert start_date == expected_start
        assert start_date.strftime('%Y-%m-%d') == '2024-02-14'  # March 15 - 30 days = Feb 14
        
        # Check other return values
        assert freq == 'D'
        assert date_format == '%Y-%m-%d'
        assert period_name == 'Monthly'
    
    def test_period_calc_yearly(self):
        end_date = pd.Timestamp('2024-03-15')
        
        start_date, freq, date_format, period_name = period_calc('y', end_date)
        
        # Check start date is 365 days before end date
        expected_start = end_date - pd.Timedelta(days=365)
        assert start_date == expected_start
        assert start_date.strftime('%Y-%m-%d') == '2023-03-16'  # 2024 is leap year
        
        # Check other return values
        assert freq == 'M'
        assert date_format == '%Y-%m'
        assert period_name == 'Yearly'
    
    def test_period_calc_with_different_end_dates(self):
        test_cases = [
            # (end_date, expected_weekly_start, expected_monthly_start, expected_yearly_start)
            ('2024-01-01', '2023-12-25', '2023-12-02', '2023-01-01'),
            ('2024-06-15', '2024-06-08', '2024-05-16', '2023-06-16'),
            ('2024-12-31', '2024-12-24', '2024-12-01', '2024-01-01'),
        ]
        
        for end_str, expected_weekly, expected_monthly, expected_yearly in test_cases:
            end_date = pd.Timestamp(end_str)
            
            # Test weekly
            start, freq, fmt, name = period_calc('w', end_date)
            assert start.strftime('%Y-%m-%d') == expected_weekly
            
            # Test monthly
            start, freq, fmt, name = period_calc('m', end_date)
            assert start.strftime('%Y-%m-%d') == expected_monthly
            
            # Test yearly
            start, freq, fmt, name = period_calc('y', end_date)
            assert start.strftime('%Y-%m-%d') == expected_yearly
    
    def test_period_calc_edge_cases(self):

        end_date = pd.Timestamp('2024-02-29')  # Leap year
        start, _, _, _ = period_calc('m', end_date)
        assert start.strftime('%Y-%m-%d') == '2024-01-30'  # Feb 29 - 30 days = Jan 30
        
        end_date = pd.Timestamp('2024-12-31')
        start, _, _, _ = period_calc('y', end_date)
        assert start.strftime('%Y-%m-%d') == '2024-01-01'

        end_date = pd.Timestamp('2024-01-01')
        start, _, _, _ = period_calc('m', end_date)
        assert start.strftime('%Y-%m-%d') == '2023-12-02'  # Jan 1 - 30 days = Dec 2
    
    def test_period_calc_invalid_period(self):
        end_date = pd.Timestamp('2024-03-15')
        
        # Invalid period should go to else branch (yearly)
        start, freq, date_format, period_name = period_calc('invalid', end_date)
        
        expected_start = end_date - pd.Timedelta(days=365)
        assert start == expected_start
        assert freq == 'M'
        assert date_format == '%Y-%m'
        assert period_name == 'Yearly'
    
    def test_period_calc_with_time_component(self):
        end_date = pd.Timestamp('2024-03-15 14:30:45')
        
        start, _, _, _ = period_calc('w', end_date)
        
        # Time component should be preserved in the calculation
        expected_start = end_date - pd.Timedelta(days=7)
        assert start == expected_start
        assert start.hour == 14
        assert start.minute == 30
        assert start.second == 45
    
    def test_period_calc_returns_tuple(self):
        end_date = pd.Timestamp('2024-03-15')
        result = period_calc('w', end_date)
        
        assert isinstance(result, tuple)
        assert len(result) == 4

        start, freq, date_format, period_name = result
        assert isinstance(start, pd.Timestamp)
        assert isinstance(freq, str)
        assert isinstance(date_format, str)
        assert isinstance(period_name, str)
    
    @pytest.mark.parametrize("period,expected_freq,expected_format,expected_name", [
        ('w', 'D', '%Y-%m-%d', 'Weekly'),
        ('m', 'D', '%Y-%m-%d', 'Monthly'),
        ('y', 'M', '%Y-%m', 'Yearly'),
    ])
    def test_period_calc_parametrized(self, period, expected_freq, expected_format, expected_name):
        end_date = pd.Timestamp('2024-03-15')
        
        start, freq, date_format, period_name = period_calc(period, end_date)
        
        assert freq == expected_freq
        assert date_format == expected_format
        assert period_name == expected_name
        
        # Verify start date calculation
        if period == 'w':
            assert start == end_date - pd.Timedelta(days=7)
        elif period == 'm':
            assert start == end_date - pd.Timedelta(days=30)
        else:
            assert start == end_date - pd.Timedelta(days=365)