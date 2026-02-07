import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

function Layout() {
  const location = useLocation()
  return (
    <>
      <div>From Layout - current path: {location.pathname}</div>
      <Outlet />
    </>
  )
}

export default Layout