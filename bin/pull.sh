#!/bin/bash
day=$(date +%Y%m%d)
scp -r root@182.92.9.182:/var/backup/mongobak/${day} .
