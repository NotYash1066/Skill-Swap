# SkillSwap Deployment Guide

This guide will walk you through deploying the SkillSwap application (MERN Stack) to a Google Cloud Platform (GCP) `e2-micro` instance for free (within the Free Tier limits).

## Prerequisites
- A Google Cloud Platform Account.
- A MongoDB Atlas Account (Free Tier).

---

## Phase 1: Create a Google Cloud VM (Free Tier)

1.  **Go to GCP Console**: Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/).
2.  **Create a Project**: Click the project dropdown at the top and create a new project (e.g., "skillswap-prod").
3.  **Navigate to Compute Engine**:
    -   In the search bar, type "VM Instances" and select **VM Instances** (Compute Engine).
    -   Enable the API if prompted (this might take a minute).
4.  **Create Instance**: Click **CREATE INSTANCE**.
5.  **Configure Instance for Free Tier**:
    -   **Name**: `skillswap-server`
    -   **Region**: Select `us-central1` (Iowa), `us-west1` (Oregon), or `us-east1` (South Carolina). *Look for "Low CO2" or check GCP Free Tier docs to confirm the region.*
    -   **Zone**: Any zone in that region (e.g., `us-central1-a`).
    -   **Machine Configuration**:
        -   Series: **E2**
        -   Machine type: **e2-micro** (2 vCPU, 1 GB memory). *This is the Always Free tier instance.*
    -   **Boot Disk**:
        -   Click **CHANGE**.
        -   Operating System: **Ubuntu**
        -   Version: **Ubuntu 22.04 LTS (x86/64)**
        -   Boot disk type: **Standard persistent disk**
        -   Size: **30 GB** (The free tier includes 30GB of standard persistent disk).
        -   Click **SELECT**.
    -   **Firewall**:
        -   Check **Allow HTTP traffic**.
        -   Check **Allow HTTPS traffic** (optional, but good practice).
6.  **Create**: Click **CREATE** at the bottom.

---

## Phase 2: Setup MongoDB Atlas (Database)

1.  Log in to [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2.  **Create a Cluster**: Select the **Shared** (FREE) tier. Choose AWS/Google/Azure and a region close to your VM (e.g., `us-central1`).
3.  **Create a User**:
    -   Go to **Database Access** -> **Add New Database User**.
    -   Method: **Password**.
    -   Username: `skillswapAdmin` (or your choice).
    -   Password: **Create a strong password** and **SAVE IT** somewhere safe.
    -   Role: "Read and write to any database".
4.  **Network Access**:
    -   Go to **Network Access** -> **Add IP Address**.
    -   Select **Allow Access from Anywhere** (`0.0.0.0/0`).
    -   *Why?* Cloud VMs have dynamic IPs. For a simple setup, this is easiest.
5.  **Get Connection String**:
    -   Go to **Database** -> Click **Connect** on your cluster.
    -   Select **Drivers** (Node.js).
    -   Copy the connection string. It looks like:
        `mongodb+srv://skillswapAdmin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

---

## Phase 3: Connect and Setup VM

1.  **SSH into VM**: In the GCP Console, find your `skillswap-server` and click the **SSH** button. A browser terminal window will open.
2.  **Update and Install Docker**:
    Copy and paste the following commands into the terminal (one block at a time):

    ```bash
    # Update packages
    sudo apt-get update

    # Install prerequisites
    sudo apt-get install -y ca-certificates curl gnupg git

    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up the repository
    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Verify Docker is running
    sudo docker run hello-world
    ```

---

## Phase 4: Deploy the Application

1.  **Clone the Repository**:
    ```bash
    git clone <YOUR_GITHUB_REPO_URL>
    cd <YOUR_REPO_NAME>
    ```
    *(Note: If your repo is private, you may need to use a Personal Access Token or SSH key)*

2.  **Configure Environment Variables**:
    Create the `.env` file for production.

    ```bash
    nano .env
    ```

    Paste the following into the file (Right-click -> Paste):

    ```env
    # MongoDB Atlas Connection String
    # REPLACE <password> with your actual password
    MONGO_URI=mongodb+srv://skillswapAdmin:YOUR_PASSWORD_HERE@cluster0.abcde.mongodb.net/SkillSwapDB?retryWrites=true&w=majority

    # JWT Secret (Make up a long random string)
    JWT_SECRET=supersecretproductionkey12345

    # Port (Keep as 5000)
    PORT=5000

    # Redis (Keep as is)
    REDIS_HOST=redis
    REDIS_PORT=6379
    ```

    Press `Ctrl+X`, then `Y`, then `Enter` to save.

3.  **Start the Application**:
    Run the production docker compose file. This will build the frontend and backend images.

    ```bash
    sudo docker compose -f docker-compose.prod.yml up -d --build
    ```

    *This step may take 5-10 minutes on a micro instance.*

4.  **Verify Status**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml ps
    ```
    You should see `skillswap-client`, `skillswap-server`, and `skillswap-redis` with status "Up".

---

## Phase 5: Access Your App

1.  Go back to the GCP Console VM Instances list.
2.  Copy the **External IP** of your `skillswap-server`.
3.  Open a browser tab and go to `http://<EXTERNAL_IP>`.
4.  You should see your SkillSwap application running!

---

## Maintenance

-   **View Logs**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml logs -f
    ```
-   **Update Code**:
    ```bash
    git pull
    sudo docker compose -f docker-compose.prod.yml up -d --build
    ```
