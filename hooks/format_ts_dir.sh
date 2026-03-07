#!/bin/bash
#first argument ($1) is the directory to format the files of.
changed_files=$(git diff --cached --name-only --diff-filter=ACMRd | grep -E $1/)
if [ -z "$changed_files" ]; then
    exit 0
fi

normalized_files=$(echo $changed_files | sed "s|$1/||g" )
cd $1
bun eslint $normalized_files
if [[ $? != 0 ]]; then
    echo "❌ Failed to format files"
    exit 1
fi
bun prettier $normalized_files --write --ignore-unknown

git update-index --again

