#EasyFind — Collaborators Guide

Welcome to EasyFind 👋

EasyFind is a real-estate platform designed to make it easier for customers to find properties, communicate with agents, and manage property listings.

At the center of EasyFind is an AI assistant called Fred.

Fred helps customers and real-estate agents communicate and complete real-estate tasks through a conversational experience.

---

🚀 What is EasyFind?

EasyFind is a real-estate platform that connects:

- 🏠 Property buyers and renters
- 👨‍💼 Real-estate agents
- 🏢 Property owners

Instead of forcing users to search through many property listings manually, users can communicate with Fred, the EasyFind AI assistant, and describe what they are looking for naturally.

For example:

«"I need a 2-bedroom apartment in Lekki with a budget of ₦3 million per year."»

Fred can understand the request and help the user find suitable properties.

---

🤖 Meet Fred — EasyFind AI

Fred is the AI assistant built into EasyFind.

Fred is designed to handle normal real-estate conversations rather than acting like a simple search box.

Fred can help users:

- 🔎 Search for properties
- 🏠 Find properties based on their requirements
- 💰 Search according to a user's budget
- 📍 Search by location
- 🛏️ Search by number of bedrooms
- 📞 Help users contact agents
- 💬 Have normal conversations about real estate
- 📋 Help manage property listings
- 🔔 Help users stay updated about properties and conversations
- 🤝 Connect customers with agents

Example conversation:

Customer:

«"I'm looking for a 3-bedroom house around Abuja. My budget is ₦5 million yearly."»

Fred:

«"Sure. What part of Abuja would you prefer?"»

Fred can continue the conversation and use the user's answers to narrow down the available properties.

---

👨‍💼 Agents

Agents are an important part of EasyFind.

Agents can use the platform to:

- Add properties
- Manage their listings
- Update property information
- Communicate with customers
- Receive customer enquiries
- Manage property availability
- Discuss prices with customers
- Keep customers updated

The goal is to make it easier for agents to manage their properties while allowing Fred to help with customer interactions.

---

👤 Customers

Customers can use EasyFind to:

1. Tell Fred what type of property they want.
2. Search through available properties.
3. View property information.
4. Contact the agent.
5. Ask questions about the property.
6. Discuss pricing and other requirements.
7. Continue communicating with the agent.
8. Receive updates about properties.

The customer should not need to understand how the underlying system works.

They should simply be able to talk to Fred naturally.

---

🏠 Property Management

Agents should be able to manage their properties through EasyFind.

A property may contain information such as:

- Property title
- Property type
- Location
- Price
- Number of bedrooms
- Number of bathrooms
- Description
- Images
- Availability
- Agent information
- Property status

Agents should be able to update their listings when information changes.

For example:

«Property price changed from ₦4,000,000 to ₦3,500,000.»

Fred should be able to use the updated information when helping customers.

---

💬 Agent ↔ Customer Communication

EasyFind should support normal real-estate conversations between agents and customers.

Examples include:

«"Is this property still available?"»

«"Can the price be negotiated?"»

«"Can I inspect the property tomorrow?"»

«"What documents are required?"»

«"Where exactly is the property located?"»

The goal is to make EasyFind feel like a real communication platform, not just a property listing website.

---

🧠 Fred's Role

Fred acts as an AI layer between the user and the EasyFind platform.

Conceptually:

                 EASYFIND
                    │
                    ▼
              🤖 FRED AI
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Customers    Agents     Properties
        │           │           │
        └───────────┼───────────┘
                    ▼
              Communication

Fred should be able to understand the user's request and interact with the appropriate EasyFind functionality.

---

🔐 Trust & Verification

EasyFind may include account verification features to help improve trust between users and agents.

Potential verification features include:

- Phone verification
- Profile verification
- Face verification
- Verified profile badges

A verified profile can help users identify accounts that have completed EasyFind's verification process.

Important: Verification status should be clearly defined by the product team so users understand exactly what a badge means.

---

🏗️ Project Structure

The project may be divided into several major areas:

EasyFind
│
├── AI / Fred
│   ├── Conversation
│   ├── Property Search
│   ├── User Requests
│   └── Agent Communication
│
├── Customers
│   ├── Authentication
│   ├── Property Search
│   ├── Saved Properties
│   └── Conversations
│
├── Agents
│   ├── Authentication
│   ├── Property Management
│   ├── Customer Conversations
│   └── Listing Management
│
├── Properties
│   ├── Property Information
│   ├── Images
│   ├── Pricing
│   ├── Location
│   └── Availability
│
└── Backend
    ├── API
    ├── Database
    ├── Authentication
    └── AI Services

The exact structure may change as development continues.

---

🤝 For New Collaborators

Before contributing to EasyFind, understand these principles:

1. Fred is not just a chatbot

Fred should eventually be able to interact with EasyFind's systems and perform useful actions.

2. The platform is built around conversations

Users should be able to explain what they want naturally instead of navigating through complicated forms.

3. Agents are also users

EasyFind is not only designed for customers. Agents need tools to manage their properties and communicate with customers.

4. Property data must be reliable

Fred's answers depend on the information stored in the EasyFind system.

Incorrect property prices, locations, availability, or agent information can lead to a bad customer experience.

5. Keep the system modular

When adding new features, avoid tightly coupling everything together.

Fred, authentication, properties, agents, conversations, and other services should be designed so they can evolve independently where possible.

---

🛠️ Contribution Guidelines

When working on EasyFind:

- Keep code clean and readable.
- Use clear variable and function names.
- Avoid unnecessary duplication.
- Document important functionality.
- Do not expose API keys or secrets.
- Do not commit ".env" files containing private credentials.
- Test new functionality before creating a pull request.
- Do not modify another collaborator's work without communicating with them.
- Keep commits focused on one logical change where possible.

---

🔀 Git Workflow

A typical workflow is:

git pull

Create a branch for your work:

git checkout -b feature/your-feature-name

Make your changes and test them.

Then:

git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name

Create a Pull Request for review.

---

📌 Current Product Vision

EasyFind is being built to become more than a traditional real-estate listing website.

The long-term goal is to create a platform where:

Customer
    │
    ▼
  Fred AI
    │
    ├── Find properties
    │
    ├── Understand requirements
    │
    ├── Connect customer with agent
    │
    ├── Answer real-estate questions
    │
    └── Keep the conversation going
             │
             ▼
           Agent
             │
             ├── Manage properties
             ├── Update prices
             ├── Respond to customers
             └── Manage listings

The objective is to make the process of finding, listing, discussing, and managing real estate simpler through AI and communication.

---

📞 Communication

If you are unsure about how a feature should work, discuss the expected behavior before making major architectural changes.

When contributing, always consider:

«"How does this make EasyFind easier for the customer or the agent?"»

That question should guide product and engineering decisions.

---

🎯 Welcome to EasyFind

We're building EasyFind + Fred to make real-estate discovery and communication easier.

Welcome to the team. 🚀