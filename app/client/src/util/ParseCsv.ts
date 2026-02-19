//this utility parses csv files using papaparse 
import Papa from "papaparse";

export interface ParsedRow {
  [key: string]: string | number | null;
}
//function takes a file object and returns an array of parsed rows using promise and papaparse lib.
export function parseCsvFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors[0].message);
        } else {
          resolve(results.data as ParsedRow[]);
        }
      },
      error: (err) => reject(err.message),
    });
  });
}
