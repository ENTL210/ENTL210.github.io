import React from "react";
import "./Messeage.css"
import {motion} from "framer-motion"

export const Messeage = ({style, messeage, state}) => {
    return (
        <motion.div className={state === true ? "messeage-active" : "messeage-inactive"} animate={state === true ? {opacity: 1} : {opacity: 0}} transition={{duration: 0.5}}>
            <img alt="" src={style === "fail" ? "./x-mark.png" : style === "success" ? "./tickmark.png" : style === "warning" ? "./warning-mark.png" : ""}/>
            <motion.p initial={{opacity:0}} animate={{opacity: 1}}>{messeage}</motion.p> 
        </motion.div>
    )
}