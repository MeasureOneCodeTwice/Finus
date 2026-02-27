import type { updateResponse } from "../type/responseTypes"

export interface Income {
    id:number,
    name:string,
    income: number,
    description: string
}

export async function getIncome() {

    const response = await fetch('/api/income', {
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
    const response = await fetch("/api/income",{
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
    const response = await fetch("/api/income",{
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