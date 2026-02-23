import type { updateResponse } from "../type/responseTypes";

//Coppied from module
export interface Account{
    id: number;
    name: string;
    type: string;
    balance: number;
    value: number;
    subtype?: string;
    last_updated: Date;
}

//Sends a request to get different accounts the user has
export async function getUserAccounts(): Promise<Account[]> {

    //Sends a http request and waits for a response
    const response = await fetch('/api/accounts', {
        method: 'GET',
        headers: {
            'Cookie': document.cookie
        }
    })

    //Determine if we were able to retrieve user's data
    if(!response.ok) {

        //Failed to retrieve user data, return empty array
        console.error("Error: Failed to retrieve users accounts ", response.status)
    }
    
    return response.json()
}

//Sends a post request to create a user account
export async function postUserAccount(newAccount:Account):Promise<updateResponse> {
    
    //Create post request and wait for response
    const response = await fetch('/api/accounts', {
        method: "POST",
        headers: {
            'content-type': '/application/json',
            'Cookie': document.cookie
        },
        body: JSON.stringify(newAccount)
    } )
    
    //Determine if our post was a success
    if(response.ok){
        alert("Account " + newAccount.name + " has been created" )
    } else {
        alert("Failed to create account " + newAccount.name)
        console.error(response.status)
    }
    
    return response.json()
}