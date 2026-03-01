
import type { updateResponse } from "../type/responseTypes"
import { type Income } from "../type/IncomeType"

const requestUrl = "http://localhost:3000/income"

export async function getIncome():Promise<Income[]> {

    try {
        const response = await fetch(requestUrl, {
            method: "GET",
            credentials: "include"
        })
        
        if(!response.ok) {
            console.error(response.status)
            alert("Failed to retrieve income")
            return []
        } else {
            return response.json()
        }
    } catch(error) {
        console.log(error)
        throw error
    }
}

export async function postIncome(name:string, income:number, description:string): Promise<updateResponse>{
    try{
        const response = await fetch(requestUrl,{
            method: "POST",
            headers:{
                "content-type": 'application/json'
            },
            credentials: "include",
            body: JSON.stringify({"name":name,"income":income,"description":description})
        })

        if(response.ok){
            alert("Created income " + name)
        } else {
            alert("Failed to create income " + name)
            console.error(response.status)
        }

        return response.json()
    } catch(error) {
        console.error(error)
        throw error
    }
}


export async function putIncome(name:string, income:number, description:string) {
    
    try {
        const response = await fetch(requestUrl,{
            method: "POST",
            headers:{
                "content-type": "applicaton/json"
            },
            credentials: "include",
            body: JSON.stringify({"name":name,"income":income,"description":description})
        })

        if(response.ok){
            alert("Created income " + name)
        } else {
            alert("Failed to create income " + name)
            console.error(response.status)
        }

        return response.ok
    } catch(error) {
        console.log(error)
        throw error
    }

}

export async function deleteIncome(selectedIncome:Income) {

    const content = JSON.stringify({id:selectedIncome.id})
    try{
        //Create delete request to delete the income 
        const response = await fetch(requestUrl,{
            method: "DELETE",
            headers: {
                "content-type": "/application/json",
            },
            credentials:"include",
            body: content
        })

        if(response.ok){
            alert("Income " + selectedIncome.name + " has been deleted")
        } else {
            alert("Failed to delete income " + selectedIncome.name)
            console.error(response.status)
        }

        return response.ok

    } catch(error) {
        console.error(error)
        throw error
    }
}