#!/bin/bash

# Exit on error
set -e

# Define colors for outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Esddar Application Deployment Script ===${NC}"
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Environment file (.env) not found.${NC}"
  echo -e "Creating one from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your actual values before proceeding.${NC}"
    echo -e "Press enter when you're ready to continue or CTRL+C to cancel."
    read
  else
    echo -e "${RED}No .env.example file found. Exiting.${NC}"
    exit 1
  fi
fi

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Check if SSL certificates exist
if [ ! -f nginx/ssl/esddar.crt ] || [ ! -f nginx/ssl/esddar.key ]; then
  echo -e "${YELLOW}SSL certificates not found.${NC}"
  echo -e "You need to provide SSL certificates for HTTPS."
  echo -e "Please place your SSL certificates in the nginx/ssl directory:"
  echo -e "  - nginx/ssl/esddar.crt (certificate file)"
  echo -e "  - nginx/ssl/esddar.key (private key file)"
  echo -e "If you don't have certificates yet, you can use Let's Encrypt to obtain free certificates."
  echo -e "${YELLOW}For development or testing, you can generate self-signed certificates.${NC}"
  echo
  echo -e "Do you want to generate self-signed certificates for testing? (y/n)"
  read generate_ssl
  
  if [ "$generate_ssl" = "y" ] || [ "$generate_ssl" = "Y" ]; then
    echo -e "Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout nginx/ssl/esddar.key -out nginx/ssl/esddar.crt \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=esddar.example.com"
    echo -e "${GREEN}Self-signed certificates generated successfully.${NC}"
  else
    echo -e "${YELLOW}Please add your SSL certificates before proceeding.${NC}"
    echo -e "Press enter when you're ready to continue or CTRL+C to cancel."
    read
  fi
fi

# Check if domain name is set properly
echo -e "Checking Nginx configuration..."
if grep -q "esddar.example.com" nginx/conf.d/default.conf; then
  echo -e "${YELLOW}Default domain (esddar.example.com) detected in Nginx configuration.${NC}"
  echo -e "Do you want to replace it with your actual domain? (y/n)"
  read replace_domain
  
  if [ "$replace_domain" = "y" ] || [ "$replace_domain" = "Y" ]; then
    echo -e "Enter your domain name (e.g. esddar.com):"
    read domain_name
    if [ -n "$domain_name" ]; then
      sed -i "s/esddar.example.com/$domain_name/g" nginx/conf.d/default.conf
      echo -e "${GREEN}Domain name updated to $domain_name${NC}"
    fi
  fi
fi

# Build and start the containers
echo -e "${GREEN}Starting deployment...${NC}"
echo -e "Building and starting Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
echo -e "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo -e "Running database migrations..."
docker-compose exec app npm run db:push

# Create admin user if needed
echo -e "Do you want to create an admin user? (y/n)"
read create_admin
if [ "$create_admin" = "y" ] || [ "$create_admin" = "Y" ]; then
  docker-compose exec app node scripts/create-admin.js
fi

# Check services status
echo -e "${GREEN}Checking service status...${NC}"
docker-compose ps

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Your application should now be running at: https://$domain_name"
echo 
echo -e "${YELLOW}Note: If you used self-signed certificates, you'll need to accept the security warning in your browser.${NC}"
echo -e "For production use, please replace the self-signed certificates with proper ones from Let's Encrypt or a commercial CA."