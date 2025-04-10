import { useState } from 'react'
import { FiMenu } from 'react-icons/fi'
import './App.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="app-container">
      <header className="header">
        <button className="hamburger-button" onClick={handleMenuClick}>
          <FiMenu />
        </button>
      </header>
      <div className="title-section">
        <h1>Cálculo de Energía</h1>
      </div>
    </div>
  )
}

export default App
