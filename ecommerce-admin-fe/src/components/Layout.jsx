import { Outlet } from 'react-router-dom'
import ThemeSync from './ThemeSync'
import Navbar from './Navbar'
import ChatbotButton from './ChatbotButton'

export default function Layout() {
  return (
    <>
      <ThemeSync />
      <Navbar />
      <Outlet />
      <ChatbotButton />
    </>
  )
}
