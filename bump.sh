#!/bin/bash

INTENT=$1

pnpm version $1 --force

VERSION=$(jq '.version' package.json)

echo "Bumping $INTENT $VERSION"

echo "export const app_version = $VERSION" > src/version.ts

