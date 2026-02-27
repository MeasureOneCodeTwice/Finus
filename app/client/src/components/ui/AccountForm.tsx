import React, { useState } from "react";
import CsvUpload from "../csvread/CsvUpload";
import './UserForm.css'
import {postUserAccount, type Account} from '../../api/Account.ts'
import { validateAccountForm } from "../../util/ValidateForms.ts";
import { handleCurrencyChange, handleCurrencyBlur } from "../../util/handleInput.ts";

interface popupProp{
    toggle: () => void;
    setAccount: (account:Account) => void
    edit: boolean
    selectedAccount?: Account
}

export const accountCategory = {
    SAVING:"Saving",
    CHEQUING: "Chequing",
    INVESTMENT: "Investment",
    DEBT: "Debt"
}

type typeofAccount = keyof typeof accountCategory

export default function popupForm({toggle, setAccount, edit, selectedAccount}:popupProp){

    //Submits the account data
    
    const handleSubmit = () => {
        let subtype = undefined
        let interest = undefined
        const accountBalance = Number(balance)

        if(accountType === accountCategory.SAVING) {
            subtype = formInput.subType
        }

        if(accountType === accountCategory.SAVING || accountType === accountCategory.DEBT){
            interest = formInput.interest
        }
        
        //Check account before validating b/c account can be undefined
        //Determine if form input for an account is valid
        if(accountType && validateAccountForm(formInput.name, accountCategory[accountType], accountBalance,file,subtype,interest)) {
           
            const newAccount: Account = {id: 0, name:formInput.name, type: accountType, balance: accountBalance, subtype:"", value:0, last_updated: new Date()}
            console.log(newAccount)

            //Send a post request to create or edit the account
            postUserAccount(newAccount).then((data)=>{

                //When creating new account, id is returned for that account
                if(data && data["id"])
                    newAccount["id"] = data["id"]

            
                if(data["lastUpdated"])
                    newAccount["last_updated"] = data["lastUpdated"]
            })
                    
            toggle()
        } else {
            alert("Please fill out the form")
        }
    }
    

    const handleChange = (event:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormInput({...formInput, [event.target.name] : event.target.value});
    }

    //Handles the bank statement 
    const handleFile = (event:React.ChangeEvent<HTMLInputElement>) => {
        
        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    }
    

    const [formInput, setFormInput] = useState({name: '', subType:'', interest: 0})
    const [file, setFile] = useState<File|undefined>(undefined)
    const[balance, setBalance] = useState<string>("")
    const[accountType, setAccountType] = useState<typeofAccount|undefined>(undefined)
       
    const accountCat: typeofAccount[] = Object.keys(accountCategory) as typeofAccount[]

  return(
    <>
      <div className="popup">

        <div className="popupForm">

            {edit ? (<h2>Edit Account</h2>):(<h2>Create Account</h2>)}

            <label htmlFor="name">Account Name:</label>
            <input type = "text" name="name" onChange={handleChange} placeholder="Enter account name"/>
            <br></br>

            <label htmlFor="accountType">Type: </label>
            <select value = {accountType} id = "type" name = "type" onChange={event => setAccountType(event.target.value as typeofAccount)}>
            <option value = "">Select Account type</option>
            {accountCat.map(category => (<option key = {category} value = {category}>{accountCategory[category]}</option>))}
            </select>
            <br></br>

            <label>Balence: $</label>
            <input  type = "text" min = "0" step ="0.01" name = "balance" value={balance} onChange={(event) => handleCurrencyChange(event, setBalance)} onBlur ={(event) => handleCurrencyBlur(event,balance,setBalance)} placeholder="0.00"/>
            <br></br>

            <label htmlFor="statement">Upload Bank Statement(.csv)</label><CsvUpload />
            <input name = "statement" type = "file" accept =".csv" id = "statement" onChange={handleFile}/>
            <br></br>

            
            {(accountType === "DEBT" || accountType === "SAVING") ? (
              <>
              <label htmlFor="interst">Interest %</label> 
              <input id = "interest" name = "interest"type = "number" min = "0" max = "100" onChange={handleChange}/>
              <br></br>
              </>
            ): null 
            }

            {(accountType === "SAVING") ? (
              <>
              <label htmlFor="subType">Type of saving account</label>
              <select id  ="subType" name = "subType" onChange={handleChange}>
                  <option value ="">Select saving type</option>
                  <option value = "TFSA">TFSA</option>
                  <option value = "RRSP">RRSP</option>
                  <option value = "FHSA">FHSA</option>
              </select>
              <br></br>
              </>
            ):null
            }

            <div className="bottomButtons">
                <button onClick={toggle}>Close</button>
                {edit? (<button onClick={handleSubmit}>Edit</button>): (<button onClick={handleSubmit}>Submit</button>)}
            </div>
        </div>

      </div>
    </>  
  )
}

