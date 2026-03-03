import { useState } from "react"
import { handleCurrencyChange, handleCurrencyBlur } from "../../utils/handleInput"
import './UserForm.css'
import {postIncome, putIncome} from "../../api/Income"
import { validateIncomeForm } from "../../utils/ValidateForms";
import { type Income } from "../../types/IncomeType"; 

interface popupProp{
    toggle: () => void;
    setIncome?: (income:Income) => void
    addIncome?: (income:Income) => void
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
                    if(result && selectedIncome && setIncome) {
                        const updateIncome: Income = {id:selectedIncome.id, name:name, income:inputAmount, description:description}
                        setIncome(updateIncome)
                    }
                })

            } else {
                postIncome(name,inputAmount,description).then((data)=>{
                    
                    const newIncome: Income = {id: 0, name:name, income:inputAmount, description:description}

                    //Determine if response gave back an id for the new created income
                    if(data && data.id) {
                
                        newIncome.id = data.id

                        //Check if add income is defined
                        if(addIncome){
                            addIncome(newIncome)
                        }
                        
                    }
                })
            }
            toggle()
        } else {
            alert("Please fillout the income form")
        }
    }

    const [name, setName] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    if(edit && selectedIncome) {
        setName(selectedIncome.name)
        setAmount(selectedIncome.toString())
        setDescription(selectedIncome.description)
    }

    return(
        <>
        <div className="popup">

            <div className="popupForm">
                {edit ? (<h2>Edit Income</h2>):(<h2>Create Income</h2>)}
                <br></br>

                <label htmlFor="income">Name: </label>
                <input type ="text" id="name" name = "income" placeholder="Enter name" onChange={(event) => setName(event.target.value)}/>
                <br></br>

                <label htmlFor="income">Income: $</label>
                <input type ="text" id="income" name = "income" value = {amount} placeholder="0.00" onChange={(event) => handleCurrencyChange(event, setAmount)} onBlur={(event) => handleCurrencyBlur(event,amount,setAmount)}/>
                <br></br>

                <label htmlFor="description">Description(optional): </label>
                <input type="text" name = "description" id = "description" placeholder="Enter Description" onChange={(event)=> setDescription(event.target.value)}/>
                <br></br>

                <div className="bottomButtons">
                    <button onClick={toggle}>Close</button>
                    {edit? (<button onClick={handleSubmit}>Edit</button>): (<button onClick={handleSubmit}>Submit</button>)}<button className=""></button>
                </div>
            </div>
        </div>
        </>  
    )
}