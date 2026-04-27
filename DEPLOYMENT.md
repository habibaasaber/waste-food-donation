# Azure Deployment Guide - Waste Food Donation App

This guide walks you through deploying the fully functional MVP to Microsoft Azure.

## Overview of Azure Services
- **Azure Database for PostgreSQL**: For the relational database holding user and donation data.
- **Azure Blob Storage**: For handling image uploads of the food donations.
- **Azure App Service**: For deploying the Python Flask backend REST API.
- **Azure Static Web Apps**: For deploying the React Vite frontend application.

---

## 1. Deploying the Database (Azure PostgreSQL)
1. Go to the Azure Portal and search for **Azure Database for PostgreSQL servers**.
2. Click **Create** and select **Flexible server**.
3. Choose a Resource Group, Server name, and Database credentials (admin username/password).
4. Under **Networking**, ensure "Allow public access from any Azure service within Azure to this server" is checked.
5. Once deployed, note down the Host name, DB name, User, and Password. Connect strings look like this: `postgresql://user:password@hostname/dbname`.

## 2. Deploying Image Storage (Azure Blob Storage)
1. Search for **Storage accounts** in the Azure Portal and click **Create**.
2. Give it a name and select your region. Standard performance is fine.
3. Once created, click on your Storage Account.
4. On the left menu under **Security + networking**, click **Access keys**.
5. Copy the **Connection string** for `key1`.
6. On the left menu under **Data storage**, click **Containers**. Create a container named `donations` and set the Public access level to `Blob (anonymous read access for blobs only)`.

## 3. Deploying the Backend (Azure App Service)
1. Search for **App Services** and click **Create -> Web App**.
2. Name the app (e.g., `food-donation-backend`).
3. Set **Publish** to `Code` and **Runtime stack** to `Python 3.11` (or your preferred version).
4. **App Service Plan**: Standard or Free (if available in your region).
5. Once created, go to the App Service. In the left menu, open **Settings -> Environment variables**. 
6. Add the following application settings:
    - `DATABASE_URL`: Your PostgreSQL connection string.
    - `AZURE_STORAGE_CONNECTION_STRING`: Your Blob Storage connection string.
    - `AZURE_CONTAINER_NAME`: `donations`
    - `JWT_SECRET_KEY`: Enter a random secure string.
7. To deploy code via VS Code: Install the **Azure App Service extension**, right-click the `backend` folder, and select **Deploy to Web App**.
8. Set Startup Command in Azure configuration to: `gunicorn --bind=0.0.0.0 --timeout 600 app:app` (You may need to add `gunicorn` to your `requirements.txt`).

## 4. Deploying the Frontend (Azure Static Web Apps)
1. In the frontend React code (`frontend/src/api.js`), update the `baseURL` to the URL of your deployed App Service backend (e.g., `https://food-donation-backend.azurewebsites.net/api`).
2. Search for **Static Web Apps** in the Azure Portal and click **Create**.
3. Fill out the basics. Under **Deployment details**, choose **GitHub** (it's recommended to push the `frontend` folder to a GitHub repository first).
4. **Build Details**:
    - **Build Presets**: React
    - **App location**: `/frontend` (or `/` if your repository only contains the frontend).
    - **Api location**: Leave blank (we deployed our API separately via App Service).
    - **Output location**: `dist`
5. Click **Review + Create**. Azure will automatically create a GitHub Action to build and deploy your React app using Vite (`npm run build`).

## Done!
Your application will now be live on the Microsoft Azure cloud. Both donors and receivers can connect globally.
