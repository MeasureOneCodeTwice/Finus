import { useState } from "react";

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
        //Determine if the input is valid
        if(selectedType && amount != 0) {
            //Insert function that handles api communication between client and server
        }
    }

    const handleFile = () =>{
        
    }

    //Holds state of user input
    const [selectedType, setSelectedType] = useState<typeOfTransfers| undefined>(undefined)
    const [amount, setAmount] = useState(0)
    const [file, setFile] = useState(null)

    //Holds the types of transfers
    const transCat: typeOfTransfers [] = Object.keys(transferCategory) as typeOfTransfers[];

    return(
        <>
        <div>
            {edit ? (<h2>Edit Transaction</h2>):(<h2>Create Transaction</h2>)}
            <form onSubmit={handleSubmit}>

                <label>Account</label>
                <select>
                    <option></option>
                </select>
                
                <br></br>

                <label>"Type"</label>
                <select id = "transferType" value = {selectedType} onChange={event => setSelectedType(event.target.value as typeOfTransfers)}>
                    <option value="">Select Type</option>
                    {transCat.map(category => (<option key = {category} value = {category}>{transferCategory[category]}</option>))}
                </select>
                <br></br>

                <label htmlFor="amount">"Ammount"</label>
                <input type = "number" id = "amount" onChange ={(event) => setAmount(Number(event.target.value))}/>
                <br></br>

                <label htmlFor="statement">Bank statement(CVS)</label>
                <input type = "file" name = "statement" accept=".cvs" onChange={handleFile}/>
                <br></br>


                <button onClick={toggle}>Close</button>
                {edit ?(<button type="submit">Edit</button>):(<button type="submit">Submit</button>)}
            </form>
        </div>
        </>
    )
}

 