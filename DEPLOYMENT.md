# Esddar Application Deployment Guide

This guide explains how to deploy the Esddar application to an AWS VPS server using Docker Compose.

## Prerequisites

- A VPS (Virtual Private Server) running Linux (Ubuntu 20.04 LTS or newer recommended)
- Domain name pointing to your server's IP address
- Docker and Docker Compose installed on the server
- SSL certificates for your domain (or use Let's Encrypt to generate free certificates)

## Initial Server Setup

### 1. Install Docker and Docker Compose

```bash
# Update package lists
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update package database with Docker packages
sudo apt update

# Install Docker
sudo apt install -y docker-ce

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group to run docker without sudo
sudo usermod -aG docker $USER
```

After running these commands, log out and log back in to apply the group membership.

### 2. Set Up Firewall (Optional but Recommended)

```bash
# Install UFW if not already installed
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Enable UFW
sudo ufw enable
```

## Deploying the Application

### 1. Clone the Repository

```bash
# Clone the repository to your server
git clone <repository-url> esddar
cd esddar
```

### 2. Configure the Application

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Edit the `.env` file and set the appropriate values for your environment:

```
# Example .env configuration
POSTGRES_USER=esddar_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=esddar_db
SESSION_SECRET=your_secure_random_string
# Add other required variables like API keys
```

### 3. Configure Nginx

Edit the `nginx/conf.d/default.conf` file to use your domain name:

```bash
# Replace esddar.example.com with your actual domain
sed -i 's/esddar.example.com/yourdomain.com/g' nginx/conf.d/default.conf
```

### 4. SSL Certificates

Place your SSL certificates in the `nginx/ssl` directory:

```bash
# Create the ssl directory if it doesn't exist
mkdir -p nginx/ssl

# Copy your SSL certificates to the appropriate locations
cp /path/to/your/certificate.crt nginx/ssl/esddar.crt
cp /path/to/your/private.key nginx/ssl/esddar.key
```

Alternatively, you can use Let's Encrypt to get free SSL certificates.

### 5. Automatic Deployment

You can use the included deployment script for a guided setup process:

```bash
./deploy.sh
```

This script will:
- Check for necessary configuration files
- Guide you through the setup process
- Build and start the Docker containers
- Run database migrations
- Create an admin user (optional)

### 6. Manual Deployment

If you prefer to deploy manually:

```bash
# Build the Docker images
docker-compose build

# Start the services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:push

# Create an admin user (optional)
docker-compose exec app node scripts/create-admin.js
```

## Accessing the Application

After deployment, your application should be accessible at your domain (https://yourdomain.com).

## Maintenance

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs app
docker-compose logs db
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f
```

### Updating the Application

```bash
# Pull the latest changes
git pull

# Rebuild and restart the containers
docker-compose down
docker-compose build
docker-compose up -d

# Run database migrations if needed
docker-compose exec app npm run db:push
```

### Backing Up the Database

```bash
# Backup the PostgreSQL database
docker-compose exec db pg_dump -U esddar_user esddar_db > backup_$(date +%Y-%m-%d_%H-%M-%S).sql
```

## Troubleshooting

### Check Container Status

```bash
docker-compose ps
```

### Inspect Container Logs

```bash
docker-compose logs app
```

### Restart Specific Service

```bash
docker-compose restart app
```

### Reset Everything and Start Over

```bash
docker-compose down -v  # This will delete volumes!
docker-compose up -d
```

## Security Best Practices

1. **Use strong passwords** for database and other services
2. **Keep your server updated** with the latest security patches
3. **Enable a firewall** to restrict access to only necessary ports
4. **Set up regular backups** of your database and application data
5. **Configure SSL properly** to ensure secure communication
6. **Use environment variables** for sensitive information, not hardcoded values
7. **Limit SSH access** to only trusted IP addresses when possible