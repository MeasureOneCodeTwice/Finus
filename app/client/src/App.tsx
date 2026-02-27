/*
This is to be used as a rerouter to various website pages.
*/

import { Suspense, useState, lazy} from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import LoadingSpinner from './components/ui/LoadingSpinner.tsx'
import AccountPopup from './components/ui/AccountForm.tsx'
import TransactionPopup from './components/ui/TransationForm.tsx'
import type { Account } from './api/Account.ts'

function App() {
  return (
    <Router>
      <Main />
    </Router>
  )
}



function Main() {
  const location = useLocation()

  return (
    <div className="App min-h-screen bg-background">
      {/* Conditionally render Navbar - adjust logic as needed */}
      {location.pathname !== '/' && location.pathname !== '/login'}
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} /> */}
          {/* Add a 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

//default page for 404 - this can test the APIs for now
function NotFoundPage() {
  const [count, setCount] = useState(0)
  const [response, setResponse] = useState('')

  //Testing popups
  const [seen, setSeen] = useState(false)
  function togglePopup(){
    setSeen(!seen)
  };

  function setAccount(account:Account){

  }

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <button onClick={async () => setResponse(await testAPI())}>
          Test API
          </button>
        <p>Response from server: {response}</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <button onClick={() => togglePopup()}>Forms</button>
      {seen ? (<AccountPopup toggle={togglePopup} setAccount={setAccount} edit = {false} />):null}
     
    </>
  )
}



// broadcast to the API gate endpoint - should receive responses from all services that are set up
async function testAPI() {
  const response = await fetch('http://localhost:3000/health').then(res => res.text())
  return response
}

export default App
