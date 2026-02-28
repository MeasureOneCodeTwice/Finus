import React, { useState, type ReactHTMLElement } from "react";
import CsvUpload from "../csvread/CsvUpload";
import './UserForm.css'
import { getUserAccounts, type Account } from "../../api/Account";
import { validateTransactionForm } from "../../util/ValidateForms";
import { postTranscations, putTranscations, type Transaction } from "../../api/Transaction";
import { handleCurrencyChange, handleCurrencyBlur } from "../../util/handleInput";

interface popupProp{
    toggle: () => void;
    setTransaction: (editedTransaction:Transaction) => void
    addTransaction: (newTransaction:Transaction) => void
    edit: boolean
    selectedTransaction?: Transaction
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
export default function popupForm({toggle,setTransaction,addTransaction, edit, selectedTransaction}:popupProp){

    //Handles the submiting the form
    const handleSubmit = () =>{

        const accountId = Number(selectedAccount)
        const transferAmount = Number(amount)
        let userTransaction: Transaction

        if(selectedType && validateTransactionForm(accountId, selectedType, transferAmount, file)){

            userTransaction = {id: 0, financialAccount_id:accountId, amount:transferAmount, type: selectedType, date: new Date()}

            if(edit && selectedTransaction) {
                try{
                    //Editing selected transaction
                    userTransaction.id = selectedTransaction.id

                    //Send a request to update the transaction
                    putTranscations(userTransaction).then((result) => {
                        //Determine if the 
                        if(result) {
                            setTransaction(userTransaction)
                        } 
                    })
                } catch(error){
                    alert("Failed to edit transaction")
                }
            } else {
        
                try{
                    //Send a request to create the transaction
                    postTranscations([userTransaction]).then((response) => {

                        //Successful put if response is returned
                        if(response && response[0].id) {
                            userTransaction.id = response[0].id
                            addTransaction(userTransaction)
                        } else {
                            alert("Failed to create transaction")
                        }
                        
                        
                    })
                } catch(error) {
                    alert("Failed to create transaction")
                }
            }

            //Need to insert function that sets the state in parent component

            toggle()
        } else {
            alert("Please fill out the transaction form")
        }

    }

    //Handle when the user adds a file to the form
    const handleFile = (event:React.ChangeEvent<HTMLInputElement>) =>{

        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    
        //Insert cvs parsing function/validation function        
    }


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

    if(edit && selectedTransaction){
        setSelectedAccount(selectedTransaction.id.toString())
        setSelectedType(selectedTransaction.type)
        setAmount(selectedTransaction.amount.toString())
    }


    return(
        <>
        <div className="popup">
            <div className="popupForm">
                {edit ? (<h2>Edit Transaction</h2>):(<h2>Create Transaction</h2>)}
                
                <label>User Account:</label>
                <select onChange={event => setSelectedAccount(event.target.value)}>
                    <option value = "">Select Account</option>
                    {account && account.map(account => <option key = {account.id} value = {account.id}>account.name (account.type)</option>)}
                </select>
                
                <br></br>

                <label>Type</label>
                <select id = "transferType" value = {selectedType} onChange={event => setSelectedType(event.target.value as typeOfTransaction)}>
                    <option value="">Select Type: </option>
                    {transCat.map(category => (<option key = {category} value = {transactionCategory[category]}>{transactionCategory[category]}</option>))}
                </select>
                <br></br>

                <label htmlFor="amount">Amount: $</label>
                <input className="moneyInput" min="0" step={"0.01"} type = "text" id = "amount" value={amount} onChange={(event) => handleCurrencyChange(event, setAmount)} onBlur={(event) => handleCurrencyBlur(event, amount, setAmount)} placeholder="0.00"/>
                <br></br>

                {edit ? (null):(
                    <>
                    <label htmlFor="statement">Bank statement(CVS)</label> <CsvUpload />
                    </>
                )} 

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

 