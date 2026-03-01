import { useState } from "react"
import { getUserAccounts} from "../../api/Account"
import { type Account } from "../../type/AccountType"
import AccountCard from "./AccountCard"
import AccountPopup from "./AccountForm"


export default function accountList(){

    //Stores a lits of the user's account
    const [userAccounts, setUserAccounts] = useState<Account[]>([])
    
    const [seen, setSeen] = useState<boolean>(false)

    //Try to get the accounts from the server
    try {
        getUserAccounts().then((accounts)=>{
            //Determine if we acquired the accounts
            if(accounts) {
                setUserAccounts(accounts)
            }
        })
    } catch(error) {

    }
    
    //Adds a account to the list
    const addAccount = (newAccount:Account) => {
        setUserAccounts(userAccounts => [...userAccounts,newAccount])
    }

    //Removes any account from the list thats shares the same id
    const removeAccount = (remove:Account) => {
        setUserAccounts(userAccounts=> userAccounts.filter((account) => account.id !== remove.id))
    }

    const toggle = () => {
        setSeen(!seen)
    }

    return(
        <>
        <div>
            <div>
            {userAccounts.map(account => (<AccountCard account={account} setAccount={addAccount} removeAccount={removeAccount}/>))}
            </div>

            <div>
                <button onClick={toggle}>Create Account</button>
            </div>
        </div>

        {seen ? (<AccountPopup toggle={toggle} addAccount={addAccount} edit = {false} />):null}
        </>
    )
}