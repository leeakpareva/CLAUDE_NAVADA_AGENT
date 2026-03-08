#!/bin/bash
# Start Oracle VM via OCI CLI
# Run from ASUS or HP to wake the Oracle VM
export OCI_CLI_SUPPRESS_FILE_PERMISSIONS_WARNING=True

oci compute instance action \
  --instance-id "ocid1.instance.oc1.uk-london-1.anwgiljswjjqxuqcbg7gznqel6d3p76sd5bvpl2pycoq35kwvi3x35ko33za" \
  --action START

echo "Oracle VM start command sent. Docker containers will auto-start (restart: always policy)"
