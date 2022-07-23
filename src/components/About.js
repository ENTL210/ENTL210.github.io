import React from "react"

const text = "     Originally from Vietnam, but I presently live in the United States with my family. I enjoy math, technology, reading, travel, meeting new people, and, of course, brewing coffee. My goal is to participate in making the world a better place to live. The purpose of this website is to introduce myself to others, practice ReactJS, and share some of my thoughts; however, this page isn't fully developed yet, so many things are still missing."

export default function About() {
    return (
        <div className="about">
            <h1>About</h1>
            <p>{text}</p>

        </div>
    )
}
