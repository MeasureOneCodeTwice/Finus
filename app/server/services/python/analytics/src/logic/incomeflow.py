import pandas as pd
from typing import List, Dict

def build_sankey_data(transactions: List[Dict]) -> Dict:
    if not transactions:
        return {
            'nodes': [{'name': 'total income'}, {'name': 'no data'}],
            'links': []
        }
    
    df = pd.DataFrame(transactions)
    df_agg = df.groupby('category').agg({'amount': 'sum'}).reset_index()
    
    total_income = df_agg[df_agg['amount'] > 0]['amount'].sum()
    total_expenses = abs(df_agg[df_agg['amount'] < 0]['amount'].sum())
    
    node_set = {'total income'}
    for _, row in df_agg.iterrows():
        node_set.add(row['category'])
    
    if total_income > total_expenses:
        node_set.add('unspent')
    elif total_expenses > total_income:
        node_set.add('overspent')
        node_set.add('savings')
    
    nodes_list = list(node_set)
    node_to_index = {node: idx for idx, node in enumerate(nodes_list)}
    links = []
    
    for _, row in df_agg[df_agg['amount'] > 0].iterrows():
        links.append({
            'source': node_to_index[row['category']],
            'target': node_to_index['total income'],
            'value': int(row['amount'])
        })
    
    for _, row in df_agg[df_agg['amount'] < 0].iterrows():
        links.append({
            'source': node_to_index['total income'],
            'target': node_to_index[row['category']],
            'value': int(abs(row['amount']))
        })
    
    if total_income > total_expenses:
        links.append({
            'source': node_to_index['total income'],
            'target': node_to_index['unspent'],
            'value': int(total_income - total_expenses)
        })
    elif total_expenses > total_income:
        links.append({
            'source': node_to_index['savings'],
            'target': node_to_index['overspent'],
            'value': int(total_expenses - total_income)
        })
    
    return {
        'nodes': [{'name': node} for node in nodes_list],
        'links': links
    }