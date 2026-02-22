import React, { useState, type ReactHTMLElement } from "react";
import CsvUpload from "../csvread/CsvUpload";
import './UserForm.css'
import { getUserAccounts, type Account } from "../../api/account";
import { validateTransactionForm } from "../../util/ValidateForms";

interface popupProp{
    toggle: () => void;
    edit: boolean
}


export const transactionCategory = {
    FOOD: 'Food',
    HOUSING: "Housing",
    UTIL: "Utilzities",
    TRANSPORTATION: "Transportation",
    OTHER: "Other",
};

//Gets the keys of the enum
type typeOfTransaction = keyof typeof transactionCategory

//Returns a form of for the user to enter their info
export default function popupForm({toggle, edit}:popupProp){

    //Handles the submiting the form
    const handleSubmit = () =>{

        const transferAmount = Number(amount)

        if(selectedType && validateTransactionForm(Number(selectedAccount), selectedType, transferAmount, file)){
            
            if(edit){
                alert("Transaction has been edited")
            } else {
                alert("Transaction has been created")
            }

            toggle()
        } else {
            alert("Please fill out the transaction form")
        }

    }

    //Handles state when currency is changed
    const handleCurrencyChange = (event:React.ChangeEvent<HTMLInputElement>) => {

        let input = event.target.value
        const pattern = /^\d*\.?\d{0,2}$/

        console.log(input)
        console.log(pattern.test(input))
        //Determine if the input follows the format/pattern
        if(pattern.test(input) || input === ""){
            input = input.replace(/^0+(?=\d)/,"")
            setAmount(input)

        }
    }

    const handleCurrencyBlur = (event:React.ChangeEvent<HTMLInputElement>) => {
        if(event.target.value !== "") {
            setAmount(parseFloat(amount).toFixed(2))
        }

    }

    const handleFile = (event:React.ChangeEvent<HTMLInputElement>) =>{

        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    
        //Insert cvs parsing function
        
    }

    //Gets user accounts
    let userAccounts: Account[] = []

    //Add when getUserAccounts is implemented
    getUserAccounts().then(accounts => {
        console.log(accounts)

        //Detemrine accounts exist
        if(accounts) {
            setAccount(accounts)
        }
    })

    //State of the user's account
    const [account, setAccount] = useState<Account[] | []>()

    //Holds state of user input
    const [selectedAccount, setSelectedAccount] = useState("")
    const [selectedType, setSelectedType] = useState("")
    const [amount, setAmount] = useState<string>("")
    const [file, setFile] = useState<File | undefined>(undefined)

    //Holds the types of transfers
    const transCat: typeOfTransaction [] = Object.keys(transactionCategory) as typeOfTransaction[];



    return(
        <>
        <div className="popup">
            <div className="popupForm">
                {edit ? (<h2>Edit Transaction</h2>):(<h2>Create Transaction</h2>)}
                
                <label>User Account:</label>
                <select onChange={event => setSelectedAccount(event.target.value)}>
                    <option value = "">Select Account</option>
                    {userAccounts.map(account => <option key = {account.id} value = {account.id}>account.name (account.type)</option>)}
                </select>
                
                <br></br>

                <label>Type</label>
                <select id = "transferType" value = {selectedType} onChange={event => setSelectedType(event.target.value as typeOfTransaction)}>
                    <option value="">Select Type: </option>
                    {transCat.map(category => (<option key = {category} value = {transactionCategory[category]}>{transactionCategory[category]}</option>))}
                </select>
                <br></br>

                <label htmlFor="amount">Amount: $</label>
                <input className="moneyInput" min="0" step={"0.01"} type = "text" id = "amount" value={amount} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} placeholder="0.00"/>
                <br></br>

                <label htmlFor="statement">Bank statement(CVS)</label> <CsvUpload />
                <input type = "file" name = "statement" accept=".cvs" onChange={handleFile}/>
                <br></br>

                <div className="bottomButtons">
                    <button onClick={toggle}>Close</button>
                    {edit ?(<button onClick={handleSubmit}>Edit</button>):(<button onClick={handleSubmit}>Submit</button>)}
                </div>
            </div>
        </div>
        </>
    )
}

 