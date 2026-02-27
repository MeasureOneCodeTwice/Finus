import { useState } from "react"
import { handleCurrencyChange, handleCurrencyBlur } from "../../util/handleInput"
import './UserForm.css'
import {getIncome, postIncome, putIncome, type Income } from "../../api/Income"
import { validateAccountForm, validateIncomeForm } from "../../util/ValidateForms";

interface popupProp{
    toggle: () => void;
    setIncome: (income:Income) => void
    addIncome: (income:Income) => void
    edit: boolean
    selectedIncome?: Income
}  

export default function popupForm({toggle,setIncome, addIncome, edit, selectedIncome}:popupProp){
    
    const handleSubmit = () => {
        
        //Convert to number
        const inputAmount = Number(amount)

        if(validateIncomeForm(name, Number(amount))){
            
            if(edit) {
                putIncome(name,inputAmount,description).then((result) =>{
                    if(result && selectedIncome) {
                        const updateIncome: Income = {id:selectedIncome.id, name:name, income:inputAmount, description:description}
                        setIncome(updateIncome)
                    }
                })

            } else {
                postIncome(name,inputAmount,description).then((data)=>{
                    
                    const newIncome: Income = {id: 0, name:name, income:inputAmount, description:description}

                    //Determine if response gave back an id for the new created income
                    if(data) {
                        
                        if(data.id){
                    
                            newIncome.id = data.id
                            addIncome(newIncome)
                        }
                    }
                })
            }
        }
    }

    const [name, setName] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    return(
        <div>
            <h2>Income</h2>
            <br></br>

            <label htmlFor="income">Name: </label>
            <input type ="string" id="name" name = "income" placeholder="Enter income" onChange={(event) => setName(event.target.value)}/>
            <br></br>

            <label htmlFor="income">Income: $</label>
            <input type ="string" id="income" name = "income" placeholder="0.00" onChange={(event) => handleCurrencyChange(event, setAmount)} onBlur={(event) => handleCurrencyBlur(event,amount,setAmount)}/>
            <br></br>

            <label htmlFor="description">Description(optional): </label>
            <input type="string" name = "description" id = "description" placeholder="Enter Description" onChange={(event)=> setDescription(event.target.value)}/>
            <br></br>

            <div className="bottomButtons">
                <button onClick={toggle}>Close</button>
                {edit? (<button onClick={handleSubmit}>Edit</button>): (<button onClick={handleSubmit}>Submit</button>)}<button className=""></button>
            </div>
        </div>
        
    )
}