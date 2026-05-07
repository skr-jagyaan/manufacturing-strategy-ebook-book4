export default {
  chapterNum:   null,
  chapterTitle: 'Onboarding',
  partName:     '',
  barTitle:     'Stop Planning, Start Winning',

  screens: [
    // 0 — Cover
    {
      type:     'cover',
      series:   'The Manufacturing Strategy Series · Book Two',
      title:    'Stop Planning,\nStart Winning',
      subtitle: 'Making Strategic Choices Competitors Can\'t Copy',
      author:   'Sudharsan K R'
    },

    // 1 — Copyright
    {
      type: 'copyright',
      body: `<p>Copyright © 2026 by Sudharsan K R</p>
<p>All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means — including photocopying, recording, or other electronic or mechanical methods — without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other non-commercial uses permitted by copyright law.</p>
<p>The case studies and scenarios featured in these pages are composite accounts based on real-world consulting experiences. Specific names, locations, and identifying business metrics have been altered to protect client confidentiality. This publication is sold with the understanding that the author is not engaged in rendering legal, accounting, or other professional compliance services.</p>
<p>Published in India.</p>`
    },

    // 2 — Table of Contents
    {
      type:  'toc',
      items: [
        { label: 'Introduction', title: 'Why Most Strategy Meetings Go Nowhere' },
        { label: 'Part One',     title: 'The Planning Trap',                    isSection: true },
        { label: 'Chapter 1',   title: 'The Strategy Illusion' },
        { label: 'Chapter 2',   title: 'The Laudable List Problem' },
        { label: 'Part Two',    title: 'The Two Strategic Choices',             isSection: true },
        { label: 'Chapter 3',   title: 'Where Could We Play?' },
        { label: 'Chapter 4',   title: 'How Could We Win There?' },
        { label: 'Chapter 5',   title: 'The Fit Between Opportunity and Advantage' },
        { label: 'Part Three',  title: 'Designing Advantage',                  isSection: true },
        { label: 'Chapter 6',   title: 'Where Advantage Actually Comes From' },
        { label: 'Chapter 7',   title: 'The Power of Trade-Offs' },
        { label: 'Part Four',   title: 'Strategy as an Integrated System',     isSection: true },
        { label: 'Chapter 8',   title: 'Strategy Is a System of Choices' },
        { label: 'Chapter 9',   title: 'Why Most Strategies Collapse' },
        { label: 'Conclusion',  title: 'Turning Strategic Ideas Into Testable Logic' },
      ]
    },

    // 3 — Preface
    {
      type:    'preface',
      heading: 'Preface',
      body:    `<p>In my career, I have not just observed the engineering and manufacturing world from the sidelines — I have been in the middle of negotiating it.</p>
<p>During years of joint venture discussions and facility visits with institutions like ISRO and IISc, I sat across the table from some of the most rigorous analytical minds in the country. In those settings, I saw what genuine intellectual discipline looks like when applied to a hard problem — the insistence on testing assumptions before acting on them, the refusal to confuse activity with progress. I learned the rigour required to translate complex, cutting-edge thinking into real-world utility.</p>
<p>I took that same lens into the boardrooms of large industrial organisations — L&T, GMR, and others. I saw how businesses at scale structure consequential decisions. How they separate strategic choice from operational execution. How they build organisations that can make decisions independently of any single individual.</p>
<p>And then I stepped into the boardrooms and factory floors of manufacturing businesses in the Rs. 10 to Rs. 50 Crore band across Pune, Coimbatore, Ahmedabad, Ludhiana, Rajkot, and the industrial estates surrounding them. What I consistently observed was this: these businesses were not failing because of poor execution. They were stalling because of unexamined strategic choices — and then treating the consequences as operational problems.</p>
<p>The clearest symptom I encountered was the annual strategy offsite — a day of genuine effort that produced a list of operational improvements and nothing that would change how the business competed in its market. Founders left that room feeling productive, holding a to-do list they called a strategy. Six months later, nothing had changed. The machine had arrived. The software was installed. The salespeople were hired. And the procurement manager still said: your quality looks good, but your price is 4% too high.</p>
<p>That gap between effort and outcome — between planning and strategy — is the subject of this book. This is not a book about working harder. It is a book about making different choices — with the clarity and discipline that the next phase of your business actually requires.</p>`
    },

    // 4 — Who Should Read This Book
    {
      type:    'who',
      heading: 'Who Should Read This Book',
      body:    `<p>This book is written for a specific kind of person at a specific kind of moment. Not everyone in manufacturing needs it. But for those who do, it will be the most important business book they read this year.</p>
<p><strong>The Founder Who Has Outgrown Their Own Business.</strong> You built this business from nothing. You funded it, fought for it, and made it work through sheer force of will. You know every machine on the floor, every customer on the books, and every margin on every job. And yet, somewhere around Rs. 20 Crore or Rs. 30 Crore or Rs. 40 Crore, the business stopped responding to effort the way it used to. You are working as hard as you ever have, and the revenue is not moving. You have tried new machines. You have tried new salespeople. You have tried new systems. Something structural is wrong, and you have not yet been able to name it. This book will name it for you.</p>
<p><strong>The Managing Director Preparing for the Next Phase.</strong> Your business is operationally sound. You have capable people, good quality systems, and a solid customer base. You are now facing the question that every well-run manufacturing business eventually confronts: what comes next? How do you move from being a reliable vendor to a recognised specialist? How do you grow profitably rather than just growing? How do you build a business that has pricing power, not just production capacity? This book answers those questions with specificity — not theory, but a practical framework for making the choices that create structural competitive advantage.</p>
<p><strong>The CA, Lawyer, or Financial Advisor to Manufacturing Businesses.</strong> You work closely with manufacturing businesses in the Rs. 10 to Rs. 50 Crore band. You see their financials, their balance sheets, their capital allocation decisions. You have watched businesses invest in machines, hire expensive executives, and attend trade shows — and return to the same revenue plateau the following year. The answer is almost always a strategy problem, not an execution problem. This book will give you the diagnostic vocabulary to recognise it.</p>
<p><strong>The Senior Leader Inside a Manufacturing Business.</strong> You are a Head of Sales, a CFO, a Head of Production, or a Quality Head. You sit in the strategy offsites. You contribute to the lists on the whiteboard. And you leave those meetings with a vague sense that what has been produced is not a strategy, but you are not sure how to say so. You want a common language for strategic thinking that you can bring into the room. This book is that language.</p>
<p><strong>Who This Book Is Not For.</strong> This book is not for businesses below Rs. 10 Crore in revenue who are still in the survival stage. It is also not for those looking for a motivational framework or a set of inspirational principles. The thinking here is analytical and sometimes uncomfortable. Strategy, properly understood, requires making painful choices — about what you will stop doing, which customers you will stop serving, and which revenue you will deliberately walk away from. If you are not ready for that discomfort, this is the wrong book. If you are ready for it, turn the page.</p>`
    },

    // 5 — Introduction screen 1
    {
      type:    'intro',
      heading: 'Why Most Strategy Meetings Go Nowhere',
      body:    `<p>Picture a scene that takes place in thousands of manufacturing businesses every single year. It is a Saturday morning in late March. The leadership team of a mid-sized manufacturing company — the Managing Director, the Head of Production, the VP of Sales, the Quality Manager, and the CFO — have gathered in a hotel conference room for their annual Strategy Offsite. The business has been stuck at the same revenue plateau for three years. Margins are shrinking, procurement buyers are demanding deeper discounts, and aggressive new competitors are entering the market. Everyone in the room knows that things need to change.</p>
<p>The Managing Director stands at the front of the room, uncaps a marker, and writes the word STRATEGY in big, bold letters on the whiteboard. For the next four hours, the room buzzes with intense, passionate energy. The Production Head argues that they need to invest in new high-speed automated machinery to reduce cycle times. The Quality Manager insists they need to implement digital inspection software. The VP of Sales demands a larger travel budget, a new CRM system, and approval to hire three new field executives to push into export markets.</p>
<p>By lunchtime, the whiteboard is entirely filled with bullet points. The Managing Director takes a photo of the whiteboard. The team goes downstairs to the hotel buffet, patting each other on the back. They feel aligned. They feel productive. They leave the offsite feeling like they have a powerful new strategy to dominate the market.</p>
<p>Six months later, they are sitting in the exact same boardroom, looking at the exact same flatlined revenue numbers. The new machines are installed and running beautifully. The quality software is active. The new salespeople are making fifty calls a day. Yet the business is still fighting for scraps. When the sales team pitches a new corporate buyer, the buyer still flips to the back of the quotation and says: "Your quality looks good, but your price is 4% too high. Match the lowest bidder, or we walk."</p>
<p>Despite executing almost everything on the whiteboard flawlessly, the company's competitive position in the market has not changed one bit. Why? Because that leadership team did not actually create a strategy in that hotel room. They created a to-do list.</p>`
    },

    // 6 — Introduction screen 2 — Deconstructing the Whiteboard
    {
      type:    'intro',
      heading: 'Deconstructing the Whiteboard',
      body:    `<p>To understand why the meeting failed, we have to look closely at the items on that whiteboard. Every single bullet point represents a massive misunderstanding of how business actually works. Improve quality — quality is not a strategy; it is an operating imperative, the minimum standard required just to be invited to quote. Buy better machines — a machine is a piece of capital equipment, and if your competitive advantage relies entirely on a machine that any of your competitors can buy simply by walking into a bank and signing a loan document, you do not have a competitive advantage. Increase exports — exports is not a strategy, it is a massive, fragmented macro-economy that provides absolutely no clarity on who you are targeting or why they should buy from you. Hire salespeople — sales and marketing are amplification tools; if your core message is that you are exactly the same as the vendor down the street but you promise you work harder, hiring more salespeople simply means you are paying more people to spread a weak message. Every item on that whiteboard was a good thing to do. But none of them were strategy.</p>
<p>What happened in that meeting is the great illusion of the business world. Smart, capable, hardworking manufacturing teams sit in a room and completely confuse planning with strategy. Planning is figuring out how to do what you already do, but doing it slightly better, faster, or cheaper. Strategy is something entirely different: making explicit, difficult, and highly specific choices about where you will compete and how you will win against ruthless competitors who want to destroy you. You cannot plan your way to higher margins. You cannot budget your way out of commoditisation. To break away from the competition, you have to stop writing lists of internal initiatives and start making strategic choices.</p>`
    },

    // 7 — About the Author
    {
      type:    'about',
      heading: 'About the Author',
      body:    `<p>Sudharsan K R is a Business Model &amp; Strategy Advisor working with Indian manufacturing MSMEs in the ₹10–50 Crore band.</p>
<p>His advisory work focuses on helping manufacturing founders replace generic benchmarking with strategic architecture — building deeply interconnected systems that rivals cannot copy. He works directly alongside promoters, managing directors, and boards on strategic choice, capital commitment, and the transition from promoter-led execution to distributed decision capability.</p>
<p>Stop Planning, Start Winning is the second book in The Manufacturing Strategy Series, which includes Why Great Manufacturers Stay Invisible, Don't Bet the Business, and Decoding the Rs. 100 Cr Breakthrough.</p>`
    },

    // 8 — Reader Form
    {
      type:    'form',
      heading: 'Before we begin',
      body:    'Tell Arjun a little about your business. He will share his notes from each chapter based on where you are right now.'
    },

    // 9 — Arjun Introduction
    {
      type:    'vikram',
      heading: 'Meet Arjun Mehta',
      body:    `<p>Arjun Mehta runs an electronics contract manufacturing unit in Chennai. ₹44 Crore now. Was at ₹28 Crore four years ago — generic PCB assembly for anyone who called, 8% EBITDA margins, procurement buyers treating him like a commodity.</p>
<p>He made the painful choice to stop taking generic assembly work entirely and focus exclusively on medical device PCB assembly with full end-of-line functional testing. He fired 11 customers in one quarter. Survived a 9-month revenue dip — his worst year on paper, his best decision in hindsight.</p>
<p>He is re-reading this book alongside you. After each chapter, he will share three notes from his own experience — what he remembers, what he got wrong, what he wishes he had understood earlier.</p>
<p>He is not a consultant. He is a founder who made the exact choices this book describes — and lived through the consequences of making them.</p>`
    }
  ]
};
