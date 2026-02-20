import React, { useState } from "react";
import CsvUpload from "../csvread/CsvUpload";
import './userForm.css'

interface popupProp{
    toggle: () => void;
    edit: boolean
}

const accountCategory = {
    SAVING:"Saving",
    CHEQUING: "Chequing",
    INVESTMENT: "Investment",
    DEBT: "Debt"
}

type typeofAccount = keyof typeof accountCategory

export default function popupForm({toggle, edit}:popupProp,){

    //Submits the account data
    const handleSubmit = () => {
        toggle()
    }
    

    const handleChange = (event:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormInput({...formInput, [event.target.name] : event.target.value});
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
            setBalence(input)

        }
    }

    //Handles the bank statement 
    const handleFile = (event:React.ChangeEvent<HTMLInputElement>) => {
        
        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    }


    //Add when getUserAccounts is implemented
    //const userAccounts = getUserAccounts()

    const [formInput, setFormInput] = useState({name: '', type:'', subType:''})
    const [file, setFile] = useState<File|undefined>(undefined)
    const[balence, setBalence] = useState("")
    const[accountType, setAccountType] = useState<typeofAccount|undefined>(undefined)
       
    const accountCat: typeofAccount[] = Object.keys(accountCategory) as typeofAccount[]

  return(
    <>
      <div className="popup">

        <form onSubmit={() => handleSubmit() }>

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
            <input  type = "text" min = "0" step ="0.01" name = "balance" value={balence} onChange={handleCurrencyChange} placeholder="0.00"/>
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
              <select id  ="subType" name = "subType">
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
                <button type = "submit">Submit</button>
            </div>
        </form>

      </div>
    </>  
  )
}

