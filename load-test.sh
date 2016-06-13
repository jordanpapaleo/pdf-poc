#!/bin/bash

FILES=../test-data/*
# FILES=../ReoAppraisals/*

let FILE_COUNT=0
START=$(date +%s)

for f in $FILES
do
  echo "Processing $f file...\n"
  curl -# -H "Content-Type:application/pdf" --upload-file $f https://reo-poc.herokuapp.com/v1/pdf &
  # curl -# -H "Content-Type:application/pdf" --upload-file $f http://localhost:8080/v1/pdf
  ((FILE_COUNT++))
  echo "\n\n"
done

END=$(date +%s)

echo "$FILE_COUNT files submitted \n"
echo "Processing Time"
echo $((END-START)) | awk '{print int($1/60)" minutes, "int($1%60)" seconds"}'
