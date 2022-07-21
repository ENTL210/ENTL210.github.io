import React from "react"
import "./NavBtn.css"

export const NavBtn = ({children, state, onClick}) => {
    return (
        <motion.button className={`btn${state == true ? "-active" : ""}`} onClick={onClick}>
            {children}
        </motion.button>
    )
}