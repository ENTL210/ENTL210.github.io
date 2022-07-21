import {React, useState} from "react"
import {NavBtn} from "./NavBtn/NavBtn"


export default function NavBar() {
    const [homeState, setHomeState] = useState(true)
    const [blogState, setBlogState] = useState(false)

    return (
        <div className="nav">
            <NavBtn state={homeState} onClick={event => {setHomeState(true); setBlogState(false)}}>Home</NavBtn>
            <NavBtn state={blogState} onClick={event => {setHomeState(false); setBlogState(true)}}>Blogs</NavBtn>
            <NavBtn onClick={event => {window.open(
            "", "_blank");}}>Repository</NavBtn>
        </div>
    )
}