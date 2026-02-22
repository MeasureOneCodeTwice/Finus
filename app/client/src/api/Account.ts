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
    const response = await fetch('127.0.0.1:3000', {
        method: 'GET',
        headers: {
            'Cookie': document.cookie
        }
    })

    //Determine if we were able to retrieve user's data
    if(response.ok) {
        return response.json()

    } else{
        //Failed to retrieve user data, return empty array
        console.error("Error: Failed to retrieve users accounts ", response.status)
        return []
    }

}

export async function postUserAccount(newAccount:Account) {
    

    const response = fetch('/api/accounts', {
        method: "POST",
        headers: {
            'content-type': '/application/json',
            'Cookie': document.cookie
        },
        body: JSON.stringify(newAccount)
    } )   
}