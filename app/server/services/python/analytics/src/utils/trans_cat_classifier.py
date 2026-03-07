from typing import Set, Dict

# this handles classification of transaction categories
# expand on these lists in the future - can also make them dynamic with ML
class CategoryClassifier:
    def __init__(self):
        self.needs_categories: Set[str] = {
            'rent', 'mortgage', 'utilities', 'groceries', 'healthcare',
            'insurance', 'transportation', 'gas', 'electricity', 'water',
            'internet', 'phone', 'minimum_debt_payment'
        }
        
        self.wants_categories: Set[str] = {
            'dining', 'restaurant', 'entertainment', 'shopping', 'clothing',
            'travel', 'vacation', 'hobbies', 'streaming', 'subscriptions',
            'coffee', 'bars', 'alcohol'
        }
        
        self.savings_categories: Set[str] = {
            'savings', 'investment', 'retirement', 'emergency_fund'
        }
    
    def classify(self, category: str) -> str:
        """Classify a single category."""
        cat_lower = category.lower()
        if cat_lower in self.needs_categories:
            return 'need'
        elif cat_lower in self.wants_categories:
            return 'want'
        elif cat_lower in self.savings_categories:
            return 'savings'
        return 'want'  # default
    
    def classify_many(self, categories: Set[str]) -> Dict[str, str]:
        """Classify multiple categories."""
        return {cat: self.classify(cat) for cat in categories}
    
    def get_categories_by_type(self, category_types: Dict[str, str], target_type: str) -> Set[str]:
        """Get all categories of a specific type."""
        return {cat for cat, typ in category_types.items() if typ == target_type}