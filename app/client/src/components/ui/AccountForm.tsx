import React, { useState } from "react";

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

export default function popupForm({toggle, edit}:popupProp,){

    //Add whne getUserAccounts is implemented
    //const userAccounts = getUserAccounts()

    const [formInput, setFormInput] = useState({name: '', balence: 0, type:'', subType:'',   })
    const [file, setFile] = useState({statement: null})

    //Submits the account data
    const handleSubmit = () => {
        toggle()
    }
    

    const handleChange = (event:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormInput({...formInput, [event.target.name] : event.target.value});
    }

    //Handles the bank statement 
    const handleFile = (event:React.ChangeEvent<HTMLInputElement>) => {
        
    }

  return(
    <>
      <div>

        {edit ? (<h2>Edit Account</h2>):(<h2>Create Account</h2>)}

        <form onSubmit={() => handleSubmit()}>

            <label htmlFor="name">Account Name:</label>
            <input type = "text" name="name" onChange={handleChange}/>
            <br></br>

            <label htmlFor="accountType">Type</label>
            <select id = "type" name = "type" onChange={handleChange}>
            <option value = "">Select Account type</option>
            <option value = "saving">Saving</option>
            <option value = "chequing">Chequing</option>
            <option value = "investment">Investment</option>
            <option value = "debt">Debt</option>
            </select>
            <br></br>

            <label>Balence</label>
            <input type = "number" min = "0" step ="0.01" name = "balance" onChange={handleChange}/>
            <br></br>

            <label htmlFor="statement">Upload Bank Statement(.csv)</label>
            <input name = "statement" type = "file" accept =".csv" id = "statement" onChange={handleFile}/>
            <br></br>

            {(formInput.type == "debt" || formInput.type == "saving") ? (
            <>
            <label htmlFor="interst">Interest %</label> 
            <input id = "interest" name = "interest"type = "number" min = "0" max = "100" onChange={handleChange}/>
            <br></br>
            </>
            ): null
            }

            {(formInput.type == "saving") ? (
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
            <button onClick={toggle}>Close</button>
            <button type = "submit">Submit</button>
        </form>

      </div>
    </>  
  )
}

