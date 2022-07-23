import React from "react";
import Introduction from "../components/Introduction"
import About from "../components/About"
import Quote from "../components/Quote"
import Social from "../components/Social"
import "../main.css"
import { Messeage } from "../components/Message/Messeage"

export default function Home({index}) {
    return (
        <div className="home-container">
            <Quote />
            <Introduction />
            <About />
            <Social />
            <Messeage style={"warning"} state={index === 0 ? false : true} messeage={"Unfortunately, blog page is not complete yet.  Please came back later!"}/>
        </div>
    )
}