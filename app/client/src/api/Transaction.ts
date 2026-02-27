import type { promises } from "dns";
import { get, request } from "http";
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

const requestUrl = "http://localhost:3000/transacitons"

//Sends a GET request to get the list of user transactions for the account
export async function getTransactions(account_id: number): Promise<Transaction[]>{

    //Put as object to convert to json when sent in the body
    const content = {"id": account_id}

    const response = await fetch(requestUrl, {
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

    const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Cookie": document.cookie,
        },
        body: JSON.stringify(trans)
    })

    if(response.ok){
        alert("Create the transaction")
    } else {
        alert("Failed to create transaction")
        console.error(response.status)
    }

    return response.json()
}

//Can send multiple transactions in a push request
export async function putTranscations(trans:Transaction):Promise<updateResponse>{

    const response = await fetch(requestUrl, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            "Cookie": document.cookie,
        },
        body: JSON.stringify(trans)
    })

    if(response.ok){
        alert("Updated the transaction")
    } else {
        alert("Failed to update transaction")
        console.error(response.status)
    }

    return response.json()
}

export async function deleteTransaction(selectedTransaction:Transaction) {

    const content = JSON.stringify({id:selectedTransaction.id, financialAccount_id:selectedTransaction.financialAccount_id})
    //Create delete request to delete the account 
    const response = await fetch(requestUrl,{
        method: "DELETE",
        headers: {
            "content-type": "/application/json",
            "Cookie":document.cookie
        },
        body: content
    })

    if(response.ok){
        alert("Transaction has been deleted")
    } else {
        alert("Failed to delete transaction")
        console.error(response.status)
    }
    
    return response.ok
}