import { React, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Link, useNavigate} from 'react-router-dom'
import "./main.css"
import NavBar from "./components/NavBar"
import Home from "./pages/Home"
import Blogs from "./pages/Blogs"


export default function App() {
    const [index, setIndex] = useState(0)

    return (
        <Router>
            <div className="container">
                <NavBar setIndex={index => setIndex(index)} />
            </div>

            <Routes>
                <Route path="/Home" element={<Home />} />
                <Route path="/blogs" element={<Blogs />} />
            </Routes>
        </Router>
    )
}