import type { updateResponse } from "../type/responseTypes"

export interface Income {
    id:number,
    name:string,
    income: number,
    description: string
}

const requestUrl = "http://localhost:3000/income"

export async function getIncome() {

    const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
            "Cookie": document.cookie
        }
    })
    
    if(!response.ok) {
        console.error(response.status)
        alert("Failed to retrieve income")
    }
}

export async function postIncome(name:string, income:number, description:string): Promise<updateResponse>{
    const response = await fetch(requestUrl,{
        method: "POST",
        headers:{
            "Cookie":document.cookie
        },
        body: JSON.stringify({"name":name,"income":income,"description":description})
    })

    if(response.ok){
        alert("Created income " + name)
    } else {
        alert("Failed to create income " + name)
        console.error(response.status)
    }

    return response.json()
}


export async function putIncome(name:string, income:number, description:string) {
    const response = await fetch(requestUrl,{
        method: "POST",
        headers:{
            "Cookie":document.cookie
        },
        body: JSON.stringify({"name":name,"income":income,"description":description})
    })

    if(response.ok){
        alert("Created income " + name)
    } else {
        alert("Failed to create income " + name)
        console.error(response.status)
    }

    return response.ok
}

export async function deleteIncome(selectedIncome:Income) {

    const content = JSON.stringify({id:selectedIncome.id})
    
    //Create delete request to delete the income 
    const response = await fetch(requestUrl,{
        method: "DELETE",
        headers: {
            "content-type": "/application/json",
            "Cookie":document.cookie
        },
        body: content
    })

    if(response.ok){
        alert("Income " + selectedIncome.name + " has been deleted")
    } else {
        alert("Failed to delete income " + selectedIncome.name)
        console.error(response.status)
    }
    
    return response.ok
}