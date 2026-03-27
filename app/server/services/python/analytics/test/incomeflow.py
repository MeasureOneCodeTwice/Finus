# tests/test_service_incomeflow.py
import pytest
import pandas as pd
from src.logic.incomeflow import build_sankey_data

class TestIncomeflowService:
    
    def test_build_sankey_data_with_income_and_expenses(self, mock_incomeflow_transactions):
        result = build_sankey_data(mock_incomeflow_transactions)
        
        assert 'nodes' in result
        assert 'links' in result
        
        # Should have total income node
        node_names = [node['name'] for node in result['nodes']]
        assert 'total income' in node_names
        
        # Should have all unique categories as nodes
        expected_categories = {'salary', 'freelance', 'interest', 'rent', 
                              'groceries', 'dining', 'entertainment', 'utilities'}
        for category in expected_categories:
            assert category in node_names
        
        # Should have links
        assert len(result['links']) > 0
        
        # Verify link structure
        for link in result['links']:
            assert 'source' in link
            assert 'target' in link
            assert 'value' in link
            assert isinstance(link['value'], int)
    
    def test_build_sankey_data_with_overflow(self):
        transactions = [
            {'amount': 5000, 'category': 'salary', 'date': '2024-03-01'},
            {'amount': 1000, 'category': 'freelance', 'date': '2024-03-02'},
            {'amount': -1500, 'category': 'rent', 'date': '2024-03-03'},
            {'amount': -500, 'category': 'groceries', 'date': '2024-03-04'},
        ]
        
        result = build_sankey_data(transactions)
        
        # Should have 'unspent' node
        node_names = [node['name'] for node in result['nodes']]
        assert 'unspent' in node_names
        
        # Should have link to unspent
        unspent_index = node_names.index('unspent')
        total_income_index = node_names.index('total income')
        
        # Find link from total income to unspent
        unspent_links = [link for link in result['links'] 
                        if link['source'] == total_income_index 
                        and link['target'] == unspent_index]
        assert len(unspent_links) == 1
        assert unspent_links[0]['value'] == 4000  # 6000 - 2000
    
    def test_build_sankey_data_with_overspending(self):
        transactions = [
            {'amount': 3000, 'category': 'salary', 'date': '2024-03-01'},
            {'amount': -1500, 'category': 'rent', 'date': '2024-03-03'},
            {'amount': -1000, 'category': 'groceries', 'date': '2024-03-04'},
            {'amount': -800, 'category': 'dining', 'date': '2024-03-05'},
        ]
        
        result = build_sankey_data(transactions)
        
        # Should have 'overspent' and 'savings' nodes
        node_names = [node['name'] for node in result['nodes']]
        assert 'overspent' in node_names
        assert 'savings' in node_names
        
        # Should have link from savings to overspent
        savings_index = node_names.index('savings')
        overspent_index = node_names.index('overspent')
        
        overspent_links = [link for link in result['links'] 
                          if link['source'] == savings_index 
                          and link['target'] == overspent_index]
        assert len(overspent_links) == 1
        assert overspent_links[0]['value'] == 300  # 3300 - 3000
    
    def test_build_sankey_data_empty_transactions(self):
        """Test sankey data with no transactions."""
        result = build_sankey_data([])
        
        assert result['nodes'] == [{'name': 'total income'}, {'name': 'no data'}]
        assert result['links'] == []
    
    def test_build_sankey_data_only_income(self):
        transactions = [
            {'amount': 5000, 'category': 'salary', 'date': '2024-03-01'},
            {'amount': 1000, 'category': 'freelance', 'date': '2024-03-02'},
        ]
        
        result = build_sankey_data(transactions)
        
        node_names = [node['name'] for node in result['nodes']]
        assert 'unspent' in node_names
        
        # All income should flow to unspent
        total_income_index = node_names.index('total income')
        unspent_index = node_names.index('unspent')
        
        unspent_links = [link for link in result['links'] 
                        if link['source'] == total_income_index 
                        and link['target'] == unspent_index]
        assert unspent_links[0]['value'] == 6000
    
    def test_build_sankey_data_only_expenses(self):
        transactions = [
            {'amount': -1500, 'category': 'rent', 'date': '2024-03-03'},
            {'amount': -500, 'category': 'groceries', 'date': '2024-03-04'},
        ]
        
        result = build_sankey_data(transactions)
        
        node_names = [node['name'] for node in result['nodes']]
        assert 'overspent' in node_names
        assert 'savings' in node_names
        
        # Expenses should come from savings
        savings_index = node_names.index('savings')
        overspent_index = node_names.index('overspent')
        rent_index = node_names.index('rent')
        groceries_index = node_names.index('groceries')
        
        # Links from savings to overspent and to categories
        savings_links = [link for link in result['links'] if link['source'] == savings_index]
        assert len(savings_links) == 1  # savings into overspent