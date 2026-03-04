import { accountCategory } from "@/enum/AccountCategory";
import { transactionCategory } from "@/enum/TransactionCategory";

export function validateAccountForm(name:string, accountType:string, balance: number, csvFile?: File, subtype?: string, interest?: number) {
    let result = false

    if(name){

        //Checks if there a cvs file uploaded first
        //Add cvs checker here=
        if(csvFile){
            result = true
            
        //Checks if all the manditory fields are valid and optional ones too if they exist
        } else if(Object.values(accountCategory).includes(accountType) && balance >= 0 && (subtype == undefined || subtype) && (interest == undefined || (interest >= 0 && interest < 100))) {
            result = true
        }
        console.log(accountType)
        console.log(accountCategory)
    }
    console.log(result)
    return result
}

export function validateTransactionForm(account_id:number, transactionType:string, amount:number,date:string, csvFile?:File) {

    let result = false

    //Determine if account was selected
    if(account_id) {

        //Add csv checker here to validate
        if(csvFile) {
            
            result = true
        } else if(Object.values(transactionCategory).includes(transactionType) && amount > 0 && date) {
            result = true
        }
    }

    return result
} 

export function validateIncomeForm(name:string, income:number){
    return name && income > 0
}
