# Auto Deployment Guide (Git & cPanel)

This repository is configured for secure auto-deployment **without storing any confidential information (passwords, usernames, or private keys) in git**.

---

## Method 1: GitHub Actions Auto Deploy (Recommended)

When you push a commit to the `main` branch, GitHub Actions will automatically connect via SSH and deploy the latest version.

### Setup (One-Time in GitHub):
1. Go to your GitHub repository: `https://github.com/rayees004/Blitz-CS-Lab`
2. Click **Settings** > **Secrets and variables** > **Actions**.
3. Under **Repository secrets**, click **New repository secret** and add:
   - `CPANEL_SSH_HOST`: `decodexe.com` (or your server IP)
   - `CPANEL_SSH_USER`: `decodexe`
   - `CPANEL_SSH_PASSWORD`: *(your cPanel/SSH password)*
   - `CPANEL_SSH_PORT`: `22` (optional, defaults to 22)
   *(Or use `CPANEL_SSH_KEY` if you use an SSH private key instead of a password).*

Once added, every `git push origin main` will deploy automatically!

---

## Method 2: cPanel Git™ Version Control Auto Deploy

The repository includes a `.cpanel.yml` file.

### How it works:
1. In cPanel, navigate to **Git™ Version Control**.
2. Click **Manage** on your repository.
3. Under **Deploy Head Commit**, click **Deploy HEAD Commit** to manually trigger anytime.
4. For automatic deploy on push:
   - Copy the **Webhook URL** provided in cPanel Git Version Control.
   - Go to your GitHub repo > **Settings** > **Webhooks** > **Add webhook**.
   - Paste the cPanel webhook URL.
   - Every push to GitHub will automatically trigger cPanel to pull and deploy using `.cpanel.yml`.

---

## Method 3: Secure Local Script

To run deployment manually from your terminal without hardcoding credentials:

1. Create a local `.env.deploy` file (this file is ignored by git and will never be committed):
   ```ini
   CPANEL_SSH_HOST=decodexe.com
   CPANEL_SSH_USER=decodexe
   CPANEL_SSH_PASSWORD=your_password_here
   ```
   *(See `.env.deploy.example` for details).*
2. Run:
   ```bash
   python deploy_to_cpanel.py
   ```
   If credentials are not found in `.env.deploy`, the script will securely prompt for your password in the console without echoing it.

---

## Method 4: Direct GitHub Webhook (Push-to-Deploy)

A dedicated, secure webhook endpoint is available on the live backend server.

### Setup in GitHub:
1. Go to your GitHub repository: `https://github.com/rayees004/Blitz-CS-Lab`
2. Navigate to **Settings** > **Webhooks** > **Add webhook**.
3. Set the fields:
   - **Payload URL**: `https://backend.decodexe.com/api/webhook/github-deploy/`
   - **Content type**: `application/json`
   - **Secret**: *(Optional: If you set `GITHUB_WEBHOOK_SECRET` in `backend/.env`, paste the same secret here)*
   - **SSL verification**: `Enable SSL verification`
   - **Which events would you like to trigger this webhook?**: `Just the push event`
   - **Active**: Checked (Enabled)
4. Click **Add webhook**.

Every time you push new commits to the `main` branch, GitHub sends a webhook to this endpoint, which immediately executes the server deployment routine:
- Pulls latest commit from GitHub `main`.
- Copies the latest compiled `frontend/dist` to `public_html`.
- Applies any pending database migrations to PostgreSQL without affecting existing data.
- Collects static files and restarts the server application.

