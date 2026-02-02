import { Outlet } from 'react-router-dom'
import ThemeSync from './ThemeSync'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <>
      <ThemeSync />
      <Navbar />
      <Outlet />
    </>
  )
}
