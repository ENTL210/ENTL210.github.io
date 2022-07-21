import {React, useState} from "react"
import {NavBtn} from "./NavBtn/NavBtn"
import { BrowserRouter as Router, Routes, Route, Link, useNavigate} from 'react-router-dom'

export default function NavBar(props) {
    const [homeState, setHomeState] = useState(true)
    const [blogState, setBlogState] = useState(false)
    const navigate = useNavigate()

    return (
        <div className="nav">
            <NavBtn state={homeState} onClick={event => {setHomeState(true); setBlogState(false); props.setIndex(0); navigate('/', {replace: true})}}>Home</NavBtn>
            <NavBtn state={blogState} onClick={event => {setHomeState(false); setBlogState(true); props.setIndex(1); navigate('/blogs', {replace: true})}}>Blogs</NavBtn>
            <NavBtn onClick={event => {window.open(
            "https://github.com/ENTL210/ENTL210.github.io");}}>Repository</NavBtn>
        </div>
    )
}