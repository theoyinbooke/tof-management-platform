# LiveKit Self-Hosting Guide for TOF Platform
## Complete Step-by-Step Instructions for Video Conferencing Setup

---

## Table of Contents
1. [🚀 Option 1: Railway (EASIEST - 5 Minutes)](#option-1-railway-easiest)
2. [🌊 Option 2: DigitalOcean (EASY - 10 Minutes)](#option-2-digitalocean-easy)
3. [☁️ Option 3: Azure with Docker (INTERMEDIATE - 30 Minutes)](#option-3-azure-with-docker)
4. [🛠️ Option 4: Any VPS with Docker (FLEXIBLE)](#option-4-any-vps)
5. [🔧 Connecting to Your App](#connecting-to-your-app)
6. [🧪 Testing Your Setup](#testing-your-setup)
7. [💰 Cost Comparison](#cost-comparison)
8. [🚨 Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites
- Credit card for cloud services (some offer free trials)
- Your deployed TOF app URL (e.g., `https://tof.vercel.app`)
- Basic command line knowledge (we'll guide you through everything)

---

## Option 1: Railway (EASIEST) 🚀
**Time Required: 5 minutes | Cost: ~$5-20/month | Difficulty: ⭐**

Railway offers one-click deployment with automatic SSL and scaling.

### Step-by-Step Instructions:

#### 1. Create Railway Account
```
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
```

#### 2. Deploy LiveKit with One Click
```
1. Click this deploy button:
   https://railway.app/new/template/livekit
   
   OR manually:
   
2. Click "New Project" → "Deploy Template"
3. Search for "LiveKit"
4. Click "Deploy"
```

#### 3. Configure Environment Variables
After deployment, Railway will show you the deployment dashboard:

```bash
# Click on the LiveKit service
# Go to "Variables" tab
# Add these variables:

LIVEKIT_KEYS=APIkey:secret
LIVEKIT_WEBHOOK_URLS=
REDIS_URL=redis://default:password@redis:6379
```

#### 4. Get Your Server URL
```
1. Go to "Settings" tab
2. Under "Domains", click "Generate Domain"
3. Your URL will be: wss://your-app.up.railway.app
4. Copy this URL - you'll need it!
```

#### 5. Get API Credentials
```
1. In Variables tab, note your LIVEKIT_KEYS
2. Format is: APIkey:secret
3. Split these for your app:
   - API Key: APIkey
   - API Secret: secret
```

#### 6. Update Your TOF App
Add to your `.env.local`:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-app.up.railway.app
LIVEKIT_API_KEY=APIkey
LIVEKIT_API_SECRET=secret
```

**✅ DONE! Your LiveKit server is now running!**

---

## Option 2: DigitalOcean (EASY) 🌊
**Time Required: 10 minutes | Cost: ~$12-24/month | Difficulty: ⭐⭐**

DigitalOcean's App Platform makes deployment simple with better performance.

### Step-by-Step Instructions:

#### 1. Create DigitalOcean Account
```
1. Go to https://www.digitalocean.com
2. Sign up (get $200 free credit for 60 days)
3. Verify your account
```

#### 2. Create a New App
```
1. Click "Create" → "Apps"
2. Choose "Docker Hub" as source
3. Enter Docker image: livekit/livekit-server:latest
```

#### 3. Configure the App
```yaml
# Click "Edit Plan"
# Choose: Basic - $12/month (512 MB RAM, 1 vCPU)
# For production: Professional - $24/month (1 GB RAM, 1 vCPU)
```

#### 4. Set Environment Variables
Click "Environment Variables" and add:
```bash
LIVEKIT_KEYS=APIkey:secret
LIVEKIT_PORT=7880
LIVEKIT_RTC_PORT_RANGE_START=50000
LIVEKIT_RTC_PORT_RANGE_END=60000
```

#### 5. Configure Ports
```
1. Go to Settings → Ports
2. Add HTTP port: 7880
3. Add UDP port range: 50000-60000
```

#### 6. Deploy
```
1. Click "Next" → "Create Resources"
2. Wait 2-3 minutes for deployment
3. Copy your app URL: https://your-app.ondigitalocean.app
```

#### 7. Update Your TOF App
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-app.ondigitalocean.app
LIVEKIT_API_KEY=APIkey
LIVEKIT_API_SECRET=secret
```

---

## Option 3: Azure with Docker ☁️
**Time Required: 30 minutes | Cost: ~$30-50/month | Difficulty: ⭐⭐⭐**

Azure provides enterprise-grade hosting with global availability.

### Step-by-Step Instructions:

#### 1. Create Azure Account
```
1. Go to https://azure.microsoft.com/free
2. Sign up (get $200 free credit for 30 days)
3. Verify your account
```

#### 2. Install Azure CLI
```bash
# Windows (PowerShell as Administrator)
winget install Microsoft.AzureCLI

# Mac
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### 3. Login to Azure
```bash
az login
# Browser will open - sign in
```

#### 4. Create Resource Group
```bash
# Create a resource group (container for resources)
az group create \
  --name tof-livekit-rg \
  --location eastus
```

#### 5. Create Container Instance
```bash
# Create the LiveKit container
az container create \
  --resource-group tof-livekit-rg \
  --name tof-livekit \
  --image livekit/livekit-server:latest \
  --dns-name-label tof-livekit \
  --ports 7880 7881 \
  --protocol TCP \
  --environment-variables \
    LIVEKIT_KEYS=APIkey:secret \
    LIVEKIT_PORT=7880 \
    LIVEKIT_RTC_PORT=7881 \
  --cpu 2 \
  --memory 4 \
  --restart-policy Always
```

#### 6. Open Required Ports
```bash
# Create Network Security Group
az network nsg create \
  --resource-group tof-livekit-rg \
  --name tof-livekit-nsg

# Allow WebSocket port
az network nsg rule create \
  --resource-group tof-livekit-rg \
  --nsg-name tof-livekit-nsg \
  --name AllowWebSocket \
  --priority 100 \
  --destination-port-ranges 7880 \
  --protocol Tcp \
  --access Allow

# Allow RTC ports
az network nsg rule create \
  --resource-group tof-livekit-rg \
  --nsg-name tof-livekit-nsg \
  --name AllowRTC \
  --priority 101 \
  --destination-port-ranges 50000-60000 \
  --protocol Udp \
  --access Allow
```

#### 7. Get Your Server URL
```bash
# Get the container's public IP
az container show \
  --resource-group tof-livekit-rg \
  --name tof-livekit \
  --query "{FQDN:ipAddress.fqdn, IP:ipAddress.ip}" \
  --output table

# Your URL will be: wss://tof-livekit.eastus.azurecontainer.io:7880
```

#### 8. Set Up SSL (Required for Production)
```bash
# Option A: Use Azure Application Gateway (Recommended)
az network application-gateway create \
  --resource-group tof-livekit-rg \
  --name tof-livekit-gateway \
  --sku Standard_v2 \
  --public-ip-address tof-livekit-pip \
  --vnet-name tof-livekit-vnet \
  --subnet tof-livekit-subnet \
  --servers tof-livekit.eastus.azurecontainer.io \
  --http-settings-port 7880 \
  --http-settings-protocol Http \
  --frontend-port 443 \
  --protocol Https
```

#### 9. Update Your TOF App
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://tof-livekit.eastus.azurecontainer.io:7880
LIVEKIT_API_KEY=APIkey
LIVEKIT_API_SECRET=secret
```

#### 10. (Optional) Add Custom Domain
```bash
# Add custom domain to container
az container update \
  --resource-group tof-livekit-rg \
  --name tof-livekit \
  --dns-name-label meeting-tof
```

---

## Option 4: Any VPS with Docker 🛠️
**Time Required: 20 minutes | Cost: ~$5-40/month | Difficulty: ⭐⭐**

Works with any VPS provider (Vultr, Linode, Hetzner, etc.)

### Step-by-Step Instructions:

#### 1. Get a VPS
Choose any provider:
- **Vultr**: $6/month - https://vultr.com
- **Linode**: $5/month - https://linode.com
- **Hetzner**: €4/month - https://hetzner.com

Minimum specs:
- 2 vCPU
- 2GB RAM
- 50GB SSD
- Ubuntu 22.04

#### 2. SSH into Your Server
```bash
ssh root@your-server-ip
```

#### 3. Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y
```

#### 4. Create LiveKit Configuration
```bash
# Create directory
mkdir -p /opt/livekit
cd /opt/livekit

# Create config file
cat > livekit.yaml << EOF
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  tcp_port: 7881
  use_external_ip: true
keys:
  APIkey: secret
webhook:
  urls: []
turn:
  enabled: true
  domain: your-server-ip
  cert_file: ""
  key_file: ""
  tls_port: 5349
  udp_port: 3478
  external_tls: true
EOF
```

#### 5. Create Docker Compose File
```bash
cat > docker-compose.yml << EOF
version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit
    restart: unless-stopped
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-60000:50000-60000/udp"
    volumes:
      - ./livekit.yaml:/livekit.yaml
    command: --config /livekit.yaml
    environment:
      - LIVEKIT_KEYS=APIkey:secret

  caddy:
    image: caddy:alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
EOF
```

#### 6. Create Caddyfile for SSL
```bash
cat > Caddyfile << EOF
your-domain.com {
  reverse_proxy livekit:7880
}
EOF
```

#### 7. Configure Firewall
```bash
# Install UFW
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow LiveKit ports
ufw allow 7880/tcp
ufw allow 7881/tcp
ufw allow 50000:60000/udp

# Enable firewall
ufw --force enable
```

#### 8. Start Services
```bash
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### 9. Update Your TOF App
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-domain.com
LIVEKIT_API_KEY=APIkey
LIVEKIT_API_SECRET=secret
```

---

## 🔧 Connecting to Your App

After setting up LiveKit, update your TOF application:

### 1. Update Environment Variables
Edit `.env.local` in your project:
```env
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### 2. Restart Your Application
```bash
# Local development
npm run dev

# Production (Vercel)
git add .
git commit -m "Update LiveKit configuration"
git push
```

### 3. Update Vercel Environment Variables
```
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the same variables from .env.local
5. Redeploy your application
```

---

## 🧪 Testing Your Setup

### 1. Quick Connection Test
```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://your-livekit-server.com

# Should return: HTTP/1.1 426 Upgrade Required
```

### 2. Create Test Meeting
1. Go to your app's `/meetings` page
2. Click "Create Meeting"
3. Start the meeting
4. Join from another browser/device
5. Test video, audio, and screen sharing

### 3. LiveKit CLI Test (Optional)
```bash
# Install LiveKit CLI
brew install livekit-cli

# Create test token
livekit-cli create-token \
  --api-key APIkey \
  --api-secret secret \
  --join --room test-room \
  --identity test-user \
  --valid-for 24h

# Join test room
livekit-cli join-room \
  --url wss://your-server.com \
  --token <generated-token>
```

---

## 💰 Cost Comparison

| Provider | Monthly Cost | Setup Time | Difficulty | Best For |
|----------|-------------|------------|------------|----------|
| **Railway** | $5-20 | 5 min | ⭐ | Quick start, testing |
| **DigitalOcean** | $12-24 | 10 min | ⭐⭐ | Small-medium production |
| **Azure** | $30-50 | 30 min | ⭐⭐⭐ | Enterprise, global scale |
| **VPS** | $5-40 | 20 min | ⭐⭐ | Full control, cost-effective |
| **LiveKit Cloud** | $0-50 | 2 min | ⭐ | No maintenance needed |

### Usage Estimates:
- **50 users/month**: Railway or VPS ($5-10/month)
- **500 users/month**: DigitalOcean ($12-24/month)
- **5000+ users/month**: Azure or dedicated server ($50+/month)

---

## 🚨 Troubleshooting

### Common Issues and Solutions:

#### 1. "Cannot connect to meeting"
```bash
# Check if LiveKit is running
docker ps | grep livekit

# Check logs
docker logs livekit

# Solution: Restart container
docker restart livekit
```

#### 2. "Invalid token" error
```bash
# Verify environment variables match
echo $LIVEKIT_API_KEY
echo $LIVEKIT_API_SECRET

# Ensure keys in server match app
```

#### 3. "Poor video quality"
```bash
# Check server resources
docker stats livekit

# Solution: Upgrade server or reduce quality settings
```

#### 4. "Cannot share screen"
```bash
# Ensure HTTPS is enabled (required for screen sharing)
# Check SSL certificate is valid
```

#### 5. Azure specific: "Container keeps restarting"
```bash
# Check container logs
az container logs --resource-group tof-livekit-rg --name tof-livekit

# Common fix: Increase memory allocation
az container update --resource-group tof-livekit-rg --name tof-livekit --memory 8
```

---

## 📞 Support & Resources

### LiveKit Resources:
- Documentation: https://docs.livekit.io
- GitHub: https://github.com/livekit
- Community: https://livekit.io/community

### Provider-Specific Help:
- Railway: https://docs.railway.app
- DigitalOcean: https://docs.digitalocean.com
- Azure: https://docs.microsoft.com/azure
- Docker: https://docs.docker.com

### Need Help?
1. Check the logs first: `docker logs livekit`
2. Verify all ports are open
3. Ensure SSL/HTTPS is configured
4. Test with LiveKit's sample app first

---

## 🎯 Recommended Setup for TOF

Based on your needs for a Nigerian educational platform:

### For Development/Testing:
✅ **Use Railway** - Fastest setup, reliable, affordable

### For Production (100-500 users):
✅ **Use DigitalOcean** - Better performance, easy scaling, good support

### For Large Scale (500+ users):
✅ **Use Azure** - Enterprise features, global CDN, Nigerian data centers coming soon

### For Maximum Control:
✅ **Use VPS with Docker** - Full control, cost-effective, customizable

---

## 🚀 Next Steps

1. **Choose your hosting option** based on your needs
2. **Follow the step-by-step guide** for your chosen option
3. **Test the connection** using the testing section
4. **Configure your app** with the new server details
5. **Deploy to production** when ready

Remember: Start with Railway for testing, then upgrade to DigitalOcean or Azure for production when you have more users!

---

## 📝 Quick Start Checklist

- [ ] Choose hosting provider
- [ ] Create account and billing
- [ ] Deploy LiveKit server
- [ ] Configure SSL/HTTPS
- [ ] Update app environment variables
- [ ] Test video connection
- [ ] Test with multiple users
- [ ] Monitor server resources
- [ ] Set up backups (optional)
- [ ] Configure auto-scaling (optional)

---

**Last Updated**: January 2025
**Maintained by**: TheOyinbooke Foundation Development Team