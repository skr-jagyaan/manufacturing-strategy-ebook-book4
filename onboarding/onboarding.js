export default {
  screens: [

    {
      type: 'cover',
      seriesLabel: 'The Manufacturing Strategy Series',
      bookNumber: 'Book Four',
      title: 'Decoding the Rs. 100 Cr Breakthrough',
      subtitle: 'Strategic Architecture for Indian Manufacturing — From Growth Stage to Market Leadership',
      author: 'Sudharsan K R',
    },

    {
      type: 'copyright',
      seriesLine: 'The Manufacturing Strategy Series',
      bookList: [
        'Book One — Why Great Manufacturers Stay Invisible',
        'Book Two — Stop Planning, Start Winning',
        "Book Three — Don't Bet the Business",
        'Book Four — Decoding the Rs. 100 Cr Breakthrough',
      ],
      copyrightLine: 'Copyright © 2026 by Sudharsan K R',
      rights: 'All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means...',
      disclaimer: 'The case studies and financial analyses in this book draw on publicly available information about the companies discussed. They are intended as strategic frameworks for learning... composite scenarios based on real-world consulting experiences have been included.',
      publishedLine: 'Published in India.',
    },

    {
      type: 'toc',
      items: [
        { label: 'Preface', title: 'Preface', indent: 0 },
        { label: 'Who Should Read', title: 'Who Should Read This Book', indent: 0 },
        { label: 'Part One', title: 'How to Decode a Rs. 100 Cr Strategy', indent: 0, isSection: true },
        { label: 'Chapter 1', title: 'The Strategy Decoder', indent: 1 },
        { label: 'Part Two', title: 'Strategy Archetypes in Indian Manufacturing', indent: 0, isSection: true },
        { label: 'Chapter 2', title: 'The OEM Specialist — Sundram Fasteners', indent: 1 },
        { label: 'Chapter 3', title: 'The Contract Manufacturing Engine — Dixon Technologies', indent: 1 },
        { label: 'Chapter 4', title: 'The Import Substitution Strategy — AIA Engineering', indent: 1 },
        { label: 'Chapter 5', title: 'The Commodity to Brand Strategy — Astral Limited', indent: 1 },
        { label: 'Chapter 6', title: 'The White Label Ecosystem — Amber Enterprises', indent: 1 },
        { label: 'Chapter 7', title: 'The Distribution Power Strategy — KEI Industries', indent: 1 },
        { label: 'Chapter 8', title: 'The Cost Leadership Strategy — Relaxo Footwears', indent: 1 },
        { label: 'Chapter 9', title: 'The Global Niche Strategy — Vinati Organics', indent: 1 },
        { label: 'Chapter 10', title: 'The Distribution Platform Expansion — Polycab India', indent: 1 },
        { label: 'Chapter 11', title: 'The Value Chain Climb — PG Electroplast', indent: 1 },
        { label: 'Chapter 12', title: 'The Strategic Reinvention — Havells India', indent: 1 },
        { label: 'Part Three', title: 'Designing Your Rs. 100 Cr Strategic Possibilities', indent: 0, isSection: true },
        { label: 'Chapter 13', title: 'Generating Strategic Possibilities', indent: 1 },
        { label: 'Chapter 14', title: 'The Logic Test — What Would Have to Be True?', indent: 1 },
        { label: 'Chapter 15', title: 'Thin-Slicing Strategic Experiments', indent: 1 },
        { label: 'Chapter 16', title: 'Your 90-Day Strategy Roadmap', indent: 1 },
      ],
    },

    {
      type: 'preface',
      heading: 'Preface',
      body: `<p>In my career, I have not just observed the engineering and manufacturing world from the sidelines — I have been in the middle of negotiating it.</p>
             <p>The architecture of their success is entirely decodable. And once you can decode it, you can begin designing your own.</p>`,
    },

    {
      type: 'who',
      heading: 'Who Should Read This Book',
      body: `<p>This is the final book in the Manufacturing Strategy Series. It shows you what the completed architecture looks like — the integrated strategic choices that define companies operating at ₹100 Crore scale and beyond.</p>
             <p>It is designed for founders at ₹15 to ₹50 Crore revenue who feel their business has hit a structural ceiling, as well as for the boards and advisors who guide them.</p>`,
    },

    {
      type: 'intro',
      label: 'Introduction',
      heading: 'The Cargo Cult Trap',
      body: `<p>When growth-stage companies copy the surface-level actions of industry titans — buying 5-axis German CNC machines or expanding catalogues — without the underlying strategic architecture, they engage in <strong>Cargo Cult Strategy</strong>.</p>
             <p>This practice produces debt and collapsed margins, not growth. To break through, you must stop looking at their machines and start looking at their choices.</p>`,
    },

    {
      type: 'intro',
      label: 'Introduction',
      heading: 'The Five Strategic Lenses',
      body: `<p>Every successful ₹100 Crore manufacturer is decoded through five lenses: <strong>Where to Play, How to Win, Must-Have Capabilities, Trade-Offs,</strong> and <strong>Management Systems.</strong></p>
             <p>These lenses strip away the surface to reveal the architecture beneath. Strategy is not a universal best practice; it is about unique positioning.</p>`,
    },

    {
      type: 'intro',
      label: 'Introduction',
      heading: 'Your 90-Day Roadmap',
      body: `<p>Reading a book does not change a balance sheet — execution does. This book ends with a scientific methodology to design your own path.</p>
             <p>We will move from generating strategic possibilities to isolating "Kill Zones" and running Thin-Slicing experiments to extract certainty before you commit capital.</p>`,
    },

    {
      type: 'form',
      title: 'Before we begin',
      subtitle: 'Your answers personalise the reading experience and shape the strategic reflection at the end.',
      fields: [
        { id: 'readerName', label: 'Your name', placeholder: 'How should we address you?', type: 'text' },
        { id: 'readerRev', label: 'Your current revenue band', type: 'select', 
          options: [
            { value: 'under10', label: 'Under ₹10 Cr' },
            { value: '10to25', label: '₹10 Cr – ₹25 Cr' },
            { value: '25to50', label: '₹25 Cr – ₹50 Cr' },
            { value: '50plus', label: 'Above ₹50 Cr' },
          ] 
        },
        { id: 'readerSector', label: 'Your manufacturing sector', placeholder: 'e.g. Sheet metal, PCB assembly…', type: 'text' },
      ],
    },

    {
      type: 'companion',
      companionInitial: 'R',
      companionName: 'Ramesh Iyer',
      companionTitle: 'Specialty chemicals · Ahmedabad',
      body: `<p>Throughout this book, you will hear from <strong>Ramesh Iyer</strong> — a specialty chemicals manufacturer from Ahmedabad who is reading this book from ₹92 Crore, looking up at the ₹100 Crore threshold.</p>
             <p>At the end of each chapter, Ramesh will share what these strategic ideas look like from the floor of a real specialty chemicals factory.</p>`,
    },

  ]
}
