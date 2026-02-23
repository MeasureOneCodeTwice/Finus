import type { promises } from "dns";
import { get } from "http";
import { json } from "stream/consumers";
import type { updateResponse } from "../type/responseTypes";

export interface Transaction{
    id: number;
    financialAccount_id: number;
    amount: number;
    type: string
    description?: string;
    sender?: string;
    recipient?: string;
    date: Date;
}
//Sends a GET request to get the list of user transactions for the account
export async function getTransactions(account_id: number): Promise<Transaction[]>{

    //Put as object to convert to json when sent in the body
    const content = {"id": account_id}

    const response = await fetch("api/transactions", {
        method: "GET",
        headers: {
            "Cookie": document.cookie
        },
        body: JSON.stringify(content)
    })

    if(!response.ok){

        alert("Failed to retrieve account's transaction\n")
        console.error(response.status)
    }

    return response.json()
}

//Can send multiple transactions in a push request
export async function pushTranscations(trans:Transaction[]):Promise<updateResponse[]>{

    const response = await fetch("api/transacitons", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Cookie": document.cookie
        },
        body: JSON.stringify(trans)
    })

    if(response.ok){
        alert("Updated/Create the transaction")
    } else {
        alert("Failed to edit/create transaction")
        console.error(response.status)
    }

    return response.json()
}