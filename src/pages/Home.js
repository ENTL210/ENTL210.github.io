import React from "react";
import Introduction from "../components/Introduction"
import About from "../components/About"
import Quote from "../components/Quote"
import Social from "../components/Social"
import "../main.css"

export default function Home() {
    return (
        <div className="home-container">
            <Quote />
            <Introduction />
            <About />
            <Social />
        </div>
    )
}