# 📚 OnlyBooks – Online Bookstore Platform

An Online Bookstore Platform developed as a Full Stack Java mini project.  
The platform allows users to discover, search, buy, and rent books through a modern and responsive web interface integrated with Google Books API and MongoDB.

Developed as part of the **Full Stack Java Programming Lab** at **Don Bosco Institute of Technology, Mumbai**.

---

# 🚀 Features

- 🔍 Advanced book search functionality
- 📖 Dynamic product catalog using Google Books API
- 👤 User registration and login
- 🛒 Shopping cart system
- 📦 Buy and rent books
- 📜 Order history tracking
- 💾 MongoDB database integration
- 🌐 REST API-based backend
- 📱 Responsive frontend UI

---

# 🛠️ Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript

## Backend
- Java
- Maven

## Database
- MongoDB
- MongoDB Compass

## APIs & Libraries
- Google Books API
- Gson
- MongoDB Java Driver
- jBCrypt

---

# 🏗️ Project Architecture

The application follows a **3-tier architecture**:

1. **Frontend Layer** – Handles UI and user interactions  
2. **Backend Layer** – Processes business logic and APIs  
3. **Database Layer** – Stores user and order data in MongoDB  

---

# 📂 Project Structure

```text
OnlyBooks/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│
└── README.md
```

---

# ⚙️ How to Run the Project

## 1️⃣ Start MongoDB

Open terminal inside MongoDB `bin` folder:

```cmd
mongod
```

Wait for:

```text
waiting for connections on port 27017
```

---

## 2️⃣ Run Backend Server

Navigate to backend folder:

```cmd
cd backend
```

Build and run backend:

```cmd
mvn clean compile exec:java -Dexec.mainClass="com.bookstore.Main"
```

Wait for:

```text
Local Backend Server started on http://localhost:8080
```

---

## 3️⃣ Run Frontend

Open terminal inside frontend folder:

```cmd
python -m http.server 5500
```

Open browser:

```text
http://localhost:5500
```

---

# 🌐 API Endpoints

## User APIs

```http
POST /users/register
POST /users/login
GET  /users/profile
```

## Order APIs

```http
POST /orders/complete
GET  /orders/history
```

---

# 📊 Results

- Successfully integrated Google Books API
- Fetched and displayed thousands of books dynamically
- Implemented book search and filtering
- Successfully stored user and order data in MongoDB
- Achieved responsive UI and smooth backend communication

---

# 🔮 Future Improvements

- JWT Authentication
- Payment Gateway Integration
- AI-based Book Recommendations
- Cloud Deployment
- Docker Support
- Improved Accessibility
- Unit Testing

---

# 👨‍💻 Author

- Mauzzam Shaikh

Project submitted under the guidance of **Ms. Mayura Gavhane**.

---

# 📖 Learning Outcomes

Through this project, we learned:

- Full Stack Java Development
- REST API integration
- MongoDB database handling
- Frontend-backend communication
- Team collaboration and project management

---

# 📌 Conclusion

OnlyBooks demonstrates how modern web technologies can be combined to build a scalable and user-friendly online bookstore platform. The project successfully integrates frontend design, backend processing, database management, and external APIs into a complete full-stack application.