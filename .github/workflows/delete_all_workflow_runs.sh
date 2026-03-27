REPO="MeasureOneCodeTwice/Finus"

# Optional: count runs first
gh api --paginate "/repos/$REPO/actions/runs?per_page=100" --jq '.workflow_runs[].id' | wc -l

# Delete everything
gh api --paginate "/repos/$REPO/actions/runs?per_page=100" --jq '.workflow_runs[].id' \
| while read -r RUN_ID; do
    echo "Deleting run $RUN_ID"
    gh api -X DELETE "/repos/$REPO/actions/runs/$RUN_ID" >/dev/null
  done
