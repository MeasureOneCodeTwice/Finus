import React, { useState, type ReactHTMLElement } from "react";
import CsvUpload from "../csvread/CsvUpload";
import './userForm.css'

interface popupProp{
    toggle: () => void;
    edit: boolean
}


const transferCategory = {
    FOOD: 'Food',
    HOUSING: "Housing",
    UTIL: "Utilzities",
    TRANSPORTATION: "Transportation",
    OTHER: "Other",
};

//Gets the keys of the enum
type typeOfTransfers = keyof typeof transferCategory

//Returns a form of for the user to enter their info
export default function popupForm({toggle, edit}:popupProp){

    //Handles the submiting the form
    const handleSubmit = () =>{
        toggle()

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

    //Holds state of user input
    const [selectedType, setSelectedType] = useState<typeOfTransfers| undefined>(undefined)
    const [amount, setAmount] = useState<string>("")
    const [file, setFile] = useState<File | undefined>(undefined)

    //Holds the types of transfers
    const transCat: typeOfTransfers [] = Object.keys(transferCategory) as typeOfTransfers[];

    return(
        <>
        <div className="popup">
            <form onSubmit={handleSubmit}>
                {edit ? (<h2>Edit Transaction</h2>):(<h2>Create Transaction</h2>)}
                
                <label>User Account:</label>
                <select>
                    {}
                </select>
                
                <br></br>

                <label>Type</label>
                <select id = "transferType" value = {selectedType} onChange={event => setSelectedType(event.target.value as typeOfTransfers)}>
                    <option value="">Select Type: </option>
                    {transCat.map(category => (<option key = {category} value = {category}>{transferCategory[category]}</option>))}
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
                    {edit ?(<button type="submit">Edit</button>):(<button type="submit">Submit</button>)}
                </div>
            </form>
        </div>
        </>
    )
}

 