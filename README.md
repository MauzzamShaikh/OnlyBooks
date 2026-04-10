# ⚙️ Project Startup Guide

This guide explains how to run the **Online Book Store** project, including database, backend, and frontend setup.

---

## 🟢 Step 1: Start the Database (MongoDB)

Open a terminal and keep it running throughout the session.

### Navigate to MongoDB `bin` folder (if not in PATH)

```cmd
cd "C:\Program Files\MongoDB\Server\8.2\bin"
```

### Start MongoDB server

```cmd
mongod
```

✅ Wait for:

```
waiting for connections on port 27017
```

---

## 🟢 Step 2: Run the Backend (Java Server)

Open a new terminal and keep it running.

### Navigate to backend folder

```cmd
cd C:\Users\admin\Desktop\OnlineBookStore\backend
```

### Build and run the server

```cmd
mvn clean compile exec:java -Dexec.mainClass="com.bookstore.Main"
```

✅ Wait for:

```
Local Backend Server started on http://localhost:8080
```

---

## 🟢 Step 3: Launch the Frontend

### Using VS Code (Recommended)

1. Open the project folder in VS Code
2. Go to:

```
frontend/index.html
```

3. Right-click → **Open with Live Server**

---

## ✅ System Verification

If everything is working correctly:

| Component | Status  | Location                  |
| --------- | ------- | ------------------------- |
| Frontend  | Running | http://localhost:5500     |
| Backend   | Running | http://localhost:8080     |
| Database  | Running | mongodb://localhost:27017 |

---

## 🚀 Notes

* Keep all terminals running while using the application
* Ensure MongoDB is started before backend
* Backend must be running before accessing frontend features

---

## 👨‍💻 Author

**Mauzzam Shaikh**

---
