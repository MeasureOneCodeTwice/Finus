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

const requestUrl = 'http://localhost:3000/accounts'

//Sends a request to get different accounts the user has
export async function getUserAccounts(): Promise<Account[]> {

    try{
        //Sends a http request and waits for a response
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Cookie': document.cookie
            },
            credentials: "include"
        })

        //Determine if we were able to retrieve user's data
        if(!response.ok) {

            //Failed to retrieve user data, return empty array
            console.error("Error: Failed to retrieve users accounts ", response.status)
        }
        
        return response.json()
    } catch(error) {
        console.error(error)
        throw error
    }
}

//Sends a post request to create a user account
export async function postUserAccount(newAccount:Account):Promise<updateResponse> {
    
    try{
        //Create post request and wait for response
        const response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                'content-type': '/application/json'
            },
            credentials:"include",
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

    } catch(error) {
        console.error(error)
        throw error
    }
}

//Updates the users account
export async function putUserAccount(newAccount:Account):Promise<updateResponse> {
    
    try{
        //Create post request and wait for response
        const response = await fetch(requestUrl, {
            method: "PUT",
            headers: {
                'content-type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify(newAccount)
        } )
        
        //Determine if our post was a success
        if(response.ok){
            alert("Account " + newAccount.name + " has been updated" )
        } else {
            alert("Failed to update account " + newAccount.name)
            console.error(response.status)
        }
        
        return response.json()
    } catch (error) {
        console.error(error)
        throw error
    }
}



export async function deleteUserAccount(userAccount:Account) {

    const content = JSON.stringify({id:userAccount.id})
    //Create delete request to delete the account 
    const response = await fetch(requestUrl,{
        method: "DELETE",
        headers: {
            "content-type": "/application/json"
        },
        credentials:"include",
        body: content
    })

    if(response.ok){
        alert("Account " + userAccount.name + " has been deleted")
    } else {
        alert("Failed to delete account " + userAccount.name)
        console.error(response.status)
    }
    
    return response.ok
}