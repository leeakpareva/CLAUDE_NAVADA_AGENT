#!/bin/bash

# Automated Backup Script for NAVADA

date=$(date +'%Y-%m-%d %H:%M:%S')
backup_dir="/path/to/your/backup/directory"

# Create backup directory if it doesn't exist
mkdir -p "$backup_dir"

# Perform the backup (replace /path/to/nava/files with the actual directory to backup)
tar -czf "$backup_dir/navada_backup_$date.tar.gz" /path/to/nava/files

echo "Backup completed on $date"