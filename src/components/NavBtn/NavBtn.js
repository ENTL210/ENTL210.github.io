import React from "react"
import "./NavBtn.css"
import {motion} from "framer-motion"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

export const NavBtn = ({children, state, onClick}) => {
    return (
        <motion.button className={`btn${state === true ? "-active" : ""}`} onClick={onClick} whileHover={{scale: 1.2}} transition={{duration: 0.2}}>
            {children}
        </motion.button>
    )
}