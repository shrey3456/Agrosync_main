# 🌾 AgroSync - Direct Market Access Platform

AgroSync is a MERN stack platform that connects **farmers** and **consumers** directly for fresh produce trading.  
It ensures transparency, food safety, real-time payments, and powerful analytics for all users.

---

## 🚀 Features

### 👨‍🌾 Farmers
- Add products with:
  - Product name, description, price, quantity, image
  - **Harvest date** (mandatory field)
- Only visible to consumers within **500 km** for food safety.
- Farmer Dashboard:
  - Products added vs products sold (graph)
  - Monthly sales and profit tracking
  - Most sold products
  - Most active consumers

### 🛒 Consumers
- Browse all available products.
- On clicking a product:
  - View **all farmers** selling that product (filtered by distance).
- Place orders via **Razorpay (Test API)**.
- Consumer Dashboard:
  - Monthly order analytics
  - Most purchased products
  - Favorite farmers
### 📈 Price Prediction 
- A machine learning model predicts future produce prices for better buying decisions.


### 🛠️ Admin
- Manage:
  - All products
  - All orders
  - All users (Farmers/Consumers)
- Change or update order statuses.
- View overall analytics:
  - Total sales
  - Top farmers
  - Top products



---

## 📦 Tech Stack

| Frontend  | Backend | Database  | Others |
|:---------:|:-------:|:---------:|:------:|
| React.js  | Node.js (Express.js) | MongoDB Atlas | Razorpay API, Geolocation |

---
