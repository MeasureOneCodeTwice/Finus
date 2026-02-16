#!/bin/bash
#first argument ($1) is the directory to format the files of.
changed_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E $1/)
normalized_files=$(echo $changed_files | sed "s|$1/||g" )
cd $1
bun eslint $changed_dir_files
if [[ $? != 0 ]]; then
    echo "❌ Failed to format files"
    exit 1
fi
bun prettier $changed_dir_files --write --ignore-unknown
git update-index --again

