import { deleteUserAccount } from "../../api/Account.ts";
import { useState } from "react";
import AccountPopup from './AccountForm.tsx'
import { type Account } from "../../types/AccountType.ts";

interface cardProp{
    account:Account
    setAccount: (editAccount:Account) => void
    removeAccount: (removeAccount:Account) => void
}



export default function card({account, setAccount, removeAccount}:cardProp) {

    //Stores the value that toggles thhe account popup form
    const [seen, setSeen] = useState(false)

    const toggle = () => {
        setSeen(!seen)    
    }
    
    //Deletes the user account from the server and then remove it from the list
    const deleteAccount = () => {

        try {
            //Send a request to delete user account
            deleteUserAccount(account).then((result)=>{
                
                //Sucessfully deleted account
                if(result) {
                    removeAccount(account)
                }
            })
        } catch(error) {
            alert("Failed to delete account " + account.name)
        }
    }

    return(
        <>
        <div>
            <h2>{account.name}</h2>
            <br></br>

            <div>
                <p>{account.type + " " + account.subtype}</p>
                <p>{account.balance}</p>
            </div>

            <div>
                <button onClick={() => toggle()}>Edit</button>
                <button onClick={() => deleteAccount()}>Delete</button>
            </div>
        </div>
        {seen ? (<AccountPopup toggle={toggle} setAccount={setAccount} edit = {true} />):null}
        </>
    )

}