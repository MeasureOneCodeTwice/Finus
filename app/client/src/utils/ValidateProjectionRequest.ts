export function validateDebtProjection(id:number, remainingAmount:number, minimumPayment:number, interestRate:number, nextDueDate:string, period:number){
    return(id && remainingAmount >= 0 && minimumPayment > 0 && interestRate >= 0 && interestRate <= 100 && nextDueDate && period)
}

export function validateSavingProjection(id:number, interestRate: number){
    return id && interestRate >= 0 && interestRate <= 100
}