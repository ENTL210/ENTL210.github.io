import React, {useState} from "react"

function discordCopy() {
    navigator.clipboard.writeText("ETNL#8337")
}

export default function Social() {
    return (
        <div className="social">
            <h1>Ways to connect</h1>
            <div>
                <img src="./github.png"/>
                <a href="https://github.com/ENTL210">@entl210</a>
            </div>
            <div>
                <img src="./instagram.png"/>
                <a href="https://www.instagram.com/edwardnl210/">@edwardnl210</a>
            </div>
            <div>
                <img src="./discord.jpeg"/>
                <button onClick={() => {discordCopy()}}>@ETNL#8337</button>
            </div>

        </div>
    )
}
