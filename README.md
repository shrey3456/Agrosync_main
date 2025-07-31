# 🌾 AgroSync - Direct Market Access Platform

AgroSync is a MERN stack platform that connects **farmers** and **consumers** directly for fresh produce trading.  
It ensures transparency, food safety, real-time payments, and powerful analytics for all users.

## 🚀 Features

### 👨‍🌾 Farmers
- Add products with:
  - Product name, description, price, quantity, image
  - **Harvest date** (mandatory field)
- Only visible to consumers within **500 km** for food safety.
- Farmer Analytics Dashboard:
  - Monthly/Yearly sales trends visualization
  - Most sold products analysis
  - Product status distribution charts
  - Sales performance tracking

### 🛒 Consumers
- Browse all available products.
- On clicking a product:
  - View **all farmers** selling that product (filtered by distance).
- Place orders via **Razorpay (Test API)**.
- Consumer Analytics Dashboard:
  - Monthly order frequency analysis
  - Weekly/Monthly/Yearly spending patterns
  - Most purchased products visualization

### 📈 Price Prediction 
- A machine learning model predicts future produce prices for better buying decisions.


### 🛠️ Admin
- Manage:
  - All products
  - All orders
  - All users (Farmers/Consumers)
- Change or update order statuses.
- View overall analytics:
  - Total sales and revenue metrics
  - Top performing farmers
  - Most popular products
  - User engagement statistics



---

## 📦 Tech Stack

| Frontend  | Backend | Database  | Others |
|:---------:|:-------:|:---------:|:------:|
| React.js  | Node.js (Express.js) | MongoDB Atlas | Razorpay API, Geolocation |

---
