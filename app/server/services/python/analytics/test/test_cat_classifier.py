import pytest
from src.utils.trans_cat_classifier import CategoryClassifier

class TestCategoryClassifier:
    
    def test_classify_needs(self, classifier):
        assert classifier.classify('rent') == 'need'
        assert classifier.classify('groceries') == 'need'
        assert classifier.classify('healthcare') == 'need'
        assert classifier.classify('utilities') == 'need'
    
    def test_classify_wants(self, classifier):
        assert classifier.classify('dining') == 'want'
        assert classifier.classify('entertainment') == 'want'
        assert classifier.classify('shopping') == 'want'
        assert classifier.classify('coffee') == 'want'
    
    def test_classify_savings(self, classifier):
        assert classifier.classify('savings') == 'savings'
        assert classifier.classify('investment') == 'savings'
        assert classifier.classify('retirement') == 'savings'
    
    def test_classify_unknown_defaults_to_want(self, classifier):
        assert classifier.classify('unknown_category') == 'want'
        assert classifier.classify('random_stuff') == 'want'
    
    def test_classify_case_insensitive(self, classifier):
        assert classifier.classify('RENT') == 'need'
        assert classifier.classify('Groceries') == 'need'
        assert classifier.classify('DINING') == 'want'
    
    def test_classify_many(self, classifier):
        categories = {'rent', 'dining', 'savings', 'unknown'}
        result = classifier.classify_many(categories)
        
        assert result['rent'] == 'need'
        assert result['dining'] == 'want'
        assert result['savings'] == 'savings'
        assert result['unknown'] == 'want'
    
    def test_get_categories_by_type(self, classifier):
        category_types = {
            'rent': 'need',
            'groceries': 'need',
            'dining': 'want',
            'savings': 'savings'
        }
        
        needs = classifier.get_categories_by_type(category_types, 'need')
        wants = classifier.get_categories_by_type(category_types, 'want')
        savings = classifier.get_categories_by_type(category_types, 'savings')
        
        assert needs == {'rent', 'groceries'}
        assert wants == {'dining'}
        assert savings == {'savings'}